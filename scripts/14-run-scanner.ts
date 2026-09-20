import "dotenv/config";
import type { RowDataPacket } from "mysql2/promise";
import { chains } from "../config/chains.js";
import { BinanceClient } from "../src/binance/client.js";
import { BinanceBookTickerStream } from "../src/binance/book-ticker.js";
import { BookTickerStore } from "../src/market/ticker-store.js";
import { calculateBuyVwap } from "../src/market/vwap.js";
import { OkxClient } from "../src/okx/client.js";
import { quoteExactIn } from "../src/okx/quote.js";
import { searchTokenCandidates } from "../src/okx/token-search.js";
import { scanCandidateOnce } from "../src/scanner/scanner.js";
import { OpportunityLifecycle } from "../src/scanner/opportunity.js";
import { insertOpportunity } from "../src/storage/repositories/opportunities.js";
import { MySqlDatabase } from "../src/storage/mysql.js";
import { logger } from "../src/utils/logger.js";

interface CandidateRow extends RowDataPacket {
  tokenId: number;
  symbol: string;
  baseAsset: string;
  contractAddress: string;
  decimals: number;
  maxTestSize: string;
}

const db = new MySqlDatabase();
const binance = new BinanceClient();
const okx = new OkxClient();
const tickerStore = new BookTickerStore();
const lifecycle = new OpportunityLifecycle({ openThresholdPct: process.env.MIN_NET_SPREAD_PCT ?? "0.003", closeThresholdPct: process.env.OPPORTUNITY_CLOSE_THRESHOLD_PCT ?? "0.001" });
await db.healthCheck();
await db.runMigrations();
const candidates = (await db.execute<CandidateRow[]>("SELECT c.token_id AS tokenId, c.binance_symbol AS symbol, t.symbol AS baseAsset, c.contract_address AS contractAddress, m.decimals, c.max_test_size AS maxTestSize FROM scanner_candidates c JOIN tokens t ON t.id = c.token_id JOIN token_chain_mappings m ON m.token_id = c.token_id AND m.chain = c.chain AND m.contract_address = c.contract_address WHERE c.enabled = TRUE", []))[0];
const stream = new BinanceBookTickerStream(candidates.map(({ symbol }) => symbol), tickerStore);
stream.start();
const tokenCache = new Map<number, Awaited<ReturnType<typeof searchTokenCandidates>>[number]>();
const metrics = { quotes: 0, errors: 0, reconnects: 0, startedAt: Date.now() };
let scanning = false;

const costDefaults = {
  binanceFeeRate: process.env.BINANCE_FEE_RATE ?? "0.001",
  gasUsd: process.env.BSC_GAS_USD ?? "2",
  executionBufferUsd: process.env.EXECUTION_BUFFER_USD ?? "1",
  rebalanceCostUsd: process.env.REBALANCE_COST_USD ?? "0",
  tokenTax: { includedInQuote: true, additionalCostUsd: "0" },
  dexPriceImpact: { includedInQuote: true, additionalCostUsd: "0" },
};

const scan = async () => {
  if (scanning) return;
  scanning = true;
  try {
    for (const candidate of candidates) {
      const ticker = tickerStore.get(candidate.symbol);
      if (!ticker) continue;
      try {
        let token = tokenCache.get(candidate.tokenId);
        if (!token) {
          token = (await searchTokenCandidates(okx, candidate.baseAsset)).find(({ tokenContractAddress }) => tokenContractAddress.toLowerCase() === candidate.contractAddress.toLowerCase());
          if (!token) continue;
          tokenCache.set(candidate.tokenId, token);
        }
        const size = String(candidate.maxTestSize);
        const dexBuy = await quoteExactIn(okx, { chainIndex: chains.bsc.chainIndex, amount: size, fromTokenDecimals: chains.bsc.usdtDecimals, toTokenDecimals: candidate.decimals, fromTokenAddress: chains.bsc.usdtAddress, toTokenAddress: candidate.contractAddress });
        const depth = await binance.getDepth(candidate.symbol);
        const bids = depth.bids.map(([price, quantity]) => ({ price, quantity }));
        const asks = depth.asks.map(([price, quantity]) => ({ price, quantity }));
        const buyVwap = calculateBuyVwap(asks, { quoteNotional: size });
        const dexSell = await quoteExactIn(okx, { chainIndex: chains.bsc.chainIndex, amount: buyVwap.filledQuantity, fromTokenDecimals: candidate.decimals, toTokenDecimals: chains.bsc.usdtDecimals, fromTokenAddress: candidate.contractAddress, toTokenAddress: chains.bsc.usdtAddress });
        const evaluations = scanCandidateOnce({ symbol: candidate.symbol, tradeSizeUsd: size, ticker, bids, asks, dexBuy, dexSell, costs: costDefaults });
        metrics.quotes += 2;
        for (const evaluation of evaluations) {
          const direction = evaluation.spread.direction;
          const event = lifecycle.observe({ key: `${candidate.symbol}|${direction}|${size}`, netSpreadPct: evaluation.costs.netSpreadPct.toString(), netProfitUsd: evaluation.costs.netProfitUsd.toString(), observedAt: Date.now() });
          if (!event) continue;
          await insertOpportunity(db, { symbol: candidate.symbol, tokenId: candidate.tokenId, chain: "BSC", contractAddress: candidate.contractAddress, direction, tradeSizeUsd: size, binanceBid: ticker.bidPrice, binanceAsk: ticker.askPrice, binanceVwap: evaluation.binanceVwap ?? undefined, dexInputAmount: direction === "DEX_BUY_BINANCE_SELL" ? dexBuy.inputAmount : dexSell.inputAmount, dexOutputAmount: evaluation.dexOutput, dexEffectivePrice: direction === "DEX_BUY_BINANCE_SELL" ? dexBuy.effectivePrice : dexSell.effectivePrice, dexPriceImpact: direction === "DEX_BUY_BINANCE_SELL" ? dexBuy.priceImpact ?? undefined : dexSell.priceImpact ?? undefined, grossProfitUsd: evaluation.spread.grossProfitUsd, grossSpreadPct: evaluation.spread.grossSpreadPct, estimatedCostUsd: evaluation.costs.estimatedCostsUsd.toString(), netProfitUsd: evaluation.costs.netProfitUsd.toString(), netSpreadPct: evaluation.costs.netSpreadPct.toString(), quoteLatencyMs: dexBuy.quoteLatencyMs + dexSell.quoteLatencyMs, route: { buy: dexBuy.route, sell: dexSell.route }, status: event.status, firstSeenAt: new Date(event.firstSeenAt), lastSeenAt: new Date(event.lastSeenAt), durationMs: event.durationMs });
        }
      } catch (error) {
        metrics.errors += 1;
        logger.warn({ event: "scanner_candidate_failed", symbol: candidate.symbol, error: error instanceof Error ? error.message : String(error) });
      }
    }
  } finally {
    scanning = false;
  }
};

console.log(`Candidates loaded: ${candidates.length}`);
console.log("Scanner started");
const interval = setInterval(() => void scan(), Number(process.env.SCANNER_INTERVAL_MS ?? 1_000));
const health = setInterval(() => console.log({ event: "scanner_health", ...metrics, opportunitiesOpen: lifecycle.size, uptimeMs: Date.now() - metrics.startedAt }), 10_000);
const shutdown = async () => {
  clearInterval(interval);
  clearInterval(health);
  stream.stop();
  await db.close();
  console.log("Scanner stopped");
};
process.once("SIGINT", () => void shutdown().then(() => process.exit(0)));
process.once("SIGTERM", () => void shutdown().then(() => process.exit(0)));
