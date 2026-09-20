import type { OrderBookLevel } from "../market/vwap.js";
import { calculateBuyVwap, calculateSellVwap } from "../market/vwap.js";
import { calculateCosts, type CostInput, type ArbitrageCalculation } from "./costs.js";
import { calculateSpread, type SpreadResult } from "./spread.js";

export interface ScannerTickInput {
  symbol: string;
  tradeSizeUsd: string;
  ticker: { bidPrice: string; askPrice: string };
  bids: OrderBookLevel[];
  asks: OrderBookLevel[];
  dexBuy: { inputAmount: string; outputAmount: string };
  dexSell: { inputAmount: string; outputAmount: string };
  costs: Omit<CostInput, "grossProfitUsd" | "tradeSizeUsd">;
}

export interface ScannerEvaluation {
  symbol: string;
  spread: SpreadResult;
  costs: ArbitrageCalculation;
  binanceVwap: string | null;
  dexOutput: string;
}

export const scanCandidateOnce = (input: ScannerTickInput): ScannerEvaluation[] => {
  const sellVwap = calculateSellVwap(input.bids, { baseQuantity: input.dexBuy.outputAmount });
  const directionA = calculateSpread({ direction: "DEX_BUY_BINANCE_SELL", tradeSizeUsd: input.tradeSizeUsd, dex: input.dexBuy, binance: sellVwap });
  const buyVwap = calculateBuyVwap(input.asks, { quoteNotional: input.tradeSizeUsd });
  const directionB = calculateSpread({ direction: "BINANCE_BUY_DEX_SELL", tradeSizeUsd: input.tradeSizeUsd, dex: input.dexSell, binance: buyVwap });
  return [
    { symbol: input.symbol, spread: directionA, costs: calculateCosts({ ...input.costs, grossProfitUsd: directionA.grossProfitUsd, tradeSizeUsd: directionA.inputUsd }), binanceVwap: sellVwap.vwap, dexOutput: input.dexBuy.outputAmount },
    { symbol: input.symbol, spread: directionB, costs: calculateCosts({ ...input.costs, grossProfitUsd: directionB.grossProfitUsd, tradeSizeUsd: directionB.inputUsd }), binanceVwap: buyVwap.vwap, dexOutput: input.dexSell.outputAmount },
  ];
};
