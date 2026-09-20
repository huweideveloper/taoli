import "dotenv/config";
import { chains } from "../config/chains.js";
import { BinanceClient } from "../src/binance/client.js";
import { quoteExactIn } from "../src/okx/quote.js";
import { OkxClient } from "../src/okx/client.js";
import { searchTokenCandidates } from "../src/okx/token-search.js";
import { calculateBuyVwap, calculateSellVwap } from "../src/market/vwap.js";
import { calculateSpread } from "../src/scanner/spread.js";
import { calculateCosts } from "../src/scanner/costs.js";
import { formatArbitrageCalculation } from "../src/scanner/report.js";

const symbol = process.argv[2] ?? "CAKE";
const size = process.argv[3] ?? "1000";
const okx = new OkxClient();
const token = (await searchTokenCandidates(okx, symbol)).find(({ communityRecognized }) => communityRecognized);
if (!token) throw new Error(`No recognized BSC token candidate found for ${symbol}`);
const dexBuy = await quoteExactIn(okx, { chainIndex: "56", amount: size, fromTokenDecimals: chains.bsc.usdtDecimals, toTokenDecimals: Number(token.decimal), fromTokenAddress: chains.bsc.usdtAddress, toTokenAddress: token.tokenContractAddress });
const depth = await new BinanceClient().getDepth(`${token.tokenSymbol}USDT`);
const bids = depth.bids.map(([price, quantity]) => ({ price, quantity }));
const asks = depth.asks.map(([price, quantity]) => ({ price, quantity }));
const directionA = calculateSpread({ direction: "DEX_BUY_BINANCE_SELL", tradeSizeUsd: size, dex: dexBuy, binance: calculateSellVwap(bids, { baseQuantity: dexBuy.outputAmount }) });
const binanceBuy = calculateBuyVwap(asks, { quoteNotional: size });
const dexSell = await quoteExactIn(okx, { chainIndex: "56", amount: binanceBuy.filledQuantity, fromTokenDecimals: Number(token.decimal), toTokenDecimals: chains.bsc.usdtDecimals, fromTokenAddress: token.tokenContractAddress, toTokenAddress: chains.bsc.usdtAddress });
const directionB = calculateSpread({ direction: "BINANCE_BUY_DEX_SELL", tradeSizeUsd: size, dex: dexSell, binance: binanceBuy });
const costInput = {
  binanceFeeRate: process.env.BINANCE_FEE_RATE ?? "0.001",
  gasUsd: process.env.BSC_GAS_USD ?? "2",
  executionBufferUsd: process.env.EXECUTION_BUFFER_USD ?? "1",
  rebalanceCostUsd: process.env.REBALANCE_COST_USD ?? "0",
  tokenTax: { includedInQuote: true, additionalCostUsd: "0" },
  dexPriceImpact: { includedInQuote: true, additionalCostUsd: "0" },
};
const costsA = calculateCosts({ ...costInput, grossProfitUsd: directionA.grossProfitUsd, tradeSizeUsd: directionA.inputUsd });
const costsB = calculateCosts({ ...costInput, grossProfitUsd: directionB.grossProfitUsd, tradeSizeUsd: directionB.inputUsd });
console.log(`Symbol: ${token.tokenSymbol}USDT\nChain: BSC\nSize: $${size}`);
console.log(`\nDirection A\n${formatArbitrageCalculation({ label: "DEX BUY → BINANCE SELL", dexOutput: dexBuy.outputAmount, binanceVwap: calculateSellVwap(bids, { baseQuantity: dexBuy.outputAmount }).vwap ?? "unknown", spread: directionA, costs: costsA })}`);
console.log(`\nDirection B\n${formatArbitrageCalculation({ label: "BINANCE BUY → DEX SELL", dexOutput: dexSell.outputAmount, binanceVwap: binanceBuy.vwap ?? "unknown", spread: directionB, costs: costsB })}`);
