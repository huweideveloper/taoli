import { decimal, Decimal } from "../utils/decimal.js";
import type { PaperTrade } from "./executor.js";

export interface PaperEvaluation {
  grossTheoreticalPnl: Decimal;
  tradingFees: Decimal;
  gasCosts: Decimal;
  slippageCosts: Decimal;
  rebalanceCosts: Decimal;
  finalSimulatedPnl: Decimal;
  executedTrades: number;
  rejectedTrades: number;
}

export const evaluatePaperTrades = (input: { trades: PaperTrade[]; rejectedTrades: number; rebalanceCostsUsd?: string[]; slippageCostsUsd?: string[] }): PaperEvaluation => {
  let grossTheoreticalPnl = decimal(0);
  let tradingFees = decimal(0);
  let gasCosts = decimal(0);
  for (const trade of input.trades) {
    const [first, second] = trade.legs;
    grossTheoreticalPnl = grossTheoreticalPnl.plus(trade.direction === "DEX_BUY_BINANCE_SELL" ? decimal(first.quoteAmount).minus(second.quoteAmount) : decimal(second.quoteAmount).minus(first.quoteAmount));
    tradingFees = tradingFees.plus(trade.legs.reduce((sum, leg) => sum.plus(leg.feeUsd), decimal(0)));
    gasCosts = gasCosts.plus(trade.gasUsd);
  }
  const rebalanceCosts = (input.rebalanceCostsUsd ?? []).reduce((sum, value) => sum.plus(value), decimal(0));
  const slippageCosts = (input.slippageCostsUsd ?? []).reduce((sum, value) => sum.plus(value), decimal(0));
  return { grossTheoreticalPnl, tradingFees, gasCosts, slippageCosts, rebalanceCosts, finalSimulatedPnl: grossTheoreticalPnl.minus(tradingFees).minus(gasCosts).minus(slippageCosts).minus(rebalanceCosts), executedTrades: input.trades.length, rejectedTrades: input.rejectedTrades };
};
