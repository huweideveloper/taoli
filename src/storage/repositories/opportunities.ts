import type { ResultSetHeader } from "mysql2/promise";
import type { MySqlDatabase } from "../mysql.js";

export interface OpportunityRecord {
  symbol: string;
  tokenId?: number;
  chain: string;
  contractAddress: string;
  direction: string;
  tradeSizeUsd: string;
  binanceBid?: string;
  binanceAsk?: string;
  binanceVwap?: string;
  dexInputAmount?: string;
  dexOutputAmount?: string;
  dexEffectivePrice?: string;
  dexPriceImpact?: string;
  grossProfitUsd: string;
  grossSpreadPct: string;
  estimatedCostUsd: string;
  netProfitUsd: string;
  netSpreadPct: string;
  quoteLatencyMs?: number;
  route?: unknown;
  status?: "OPEN" | "UPDATED" | "CLOSED";
  firstSeenAt: Date;
  lastSeenAt: Date;
  durationMs?: number;
}

export const insertOpportunity = async (db: MySqlDatabase, opportunity: OpportunityRecord) => {
  const [result] = await db.execute<ResultSetHeader>(
    "INSERT INTO arbitrage_opportunities (symbol, token_id, chain, contract_address, direction, trade_size_usd, binance_bid, binance_ask, binance_vwap, dex_input_amount, dex_output_amount, dex_effective_price, dex_price_impact, gross_profit_usd, gross_spread_pct, estimated_cost_usd, net_profit_usd, net_spread_pct, quote_latency_ms, route_json, status, first_seen_at, last_seen_at, duration_ms) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
    [opportunity.symbol, opportunity.tokenId ?? null, opportunity.chain, opportunity.contractAddress, opportunity.direction, opportunity.tradeSizeUsd, opportunity.binanceBid ?? null, opportunity.binanceAsk ?? null, opportunity.binanceVwap ?? null, opportunity.dexInputAmount ?? null, opportunity.dexOutputAmount ?? null, opportunity.dexEffectivePrice ?? null, opportunity.dexPriceImpact ?? null, opportunity.grossProfitUsd, opportunity.grossSpreadPct, opportunity.estimatedCostUsd, opportunity.netProfitUsd, opportunity.netSpreadPct, opportunity.quoteLatencyMs ?? null, opportunity.route === undefined ? null : JSON.stringify(opportunity.route), opportunity.status ?? "OPEN", opportunity.firstSeenAt, opportunity.lastSeenAt, opportunity.durationMs ?? 0],
  );
  return result.insertId;
};

export const insertOpportunitySnapshot = async (db: MySqlDatabase, snapshot: { opportunityId: number; observedAt: Date; netSpreadPct: string; netProfitUsd: string; binancePrice?: string; dexPrice?: string }) => db.execute<ResultSetHeader>(
  "INSERT INTO opportunity_snapshots (opportunity_id, observed_at, net_spread_pct, net_profit_usd, binance_price, dex_price) VALUES (?, ?, ?, ?, ?, ?)",
  [snapshot.opportunityId, snapshot.observedAt, snapshot.netSpreadPct, snapshot.netProfitUsd, snapshot.binancePrice ?? null, snapshot.dexPrice ?? null],
);
