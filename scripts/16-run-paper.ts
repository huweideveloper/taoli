import { readFile } from "node:fs/promises";
import type { PaperTrade } from "../src/paper/executor.js";
import { evaluatePaperTrades } from "../src/paper/evaluation.js";

const file = process.env.PAPER_TRADES_FILE;
if (!file) {
  console.log("Paper mode ready. Set PAPER_TRADES_FILE to a JSON array of PaperTrade records to evaluate.");
  process.exit(0);
}
const trades = JSON.parse(await readFile(file, "utf8")) as PaperTrade[];
const result = evaluatePaperTrades({ trades, rejectedTrades: 0, rebalanceCostsUsd: [process.env.REBALANCE_COST_USD ?? "0"] });
console.log({
  "Gross theoretical PnL": result.grossTheoreticalPnl.toString(),
  "Trading fees": result.tradingFees.toString(),
  Gas: result.gasCosts.toString(),
  Slippage: result.slippageCosts.toString(),
  Rebalancing: result.rebalanceCosts.toString(),
  "Final simulated PnL": result.finalSimulatedPnl.toString(),
});
