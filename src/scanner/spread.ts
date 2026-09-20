import { decimal } from "../utils/decimal.js";
import type { VwapResult } from "../market/vwap.js";

export type SpreadDirection = "DEX_BUY_BINANCE_SELL" | "BINANCE_BUY_DEX_SELL";

export interface SpreadInput {
  direction: SpreadDirection;
  tradeSizeUsd: string;
  dex: { inputAmount: string; outputAmount: string };
  binance: VwapResult;
}

export interface SpreadResult {
  direction: SpreadDirection;
  inputUsd: string;
  outputUsd: string;
  grossProfitUsd: string;
  grossSpreadPct: string;
}

export const calculateSpread = (input: SpreadInput): SpreadResult => {
  if (input.binance.insufficientDepth) throw new Error("insufficient depth for Binance leg");
  const inputUsd = input.direction === "DEX_BUY_BINANCE_SELL" ? input.dex.inputAmount : input.binance.quoteAmount;
  const outputUsd = input.direction === "DEX_BUY_BINANCE_SELL" ? input.binance.quoteAmount : input.dex.outputAmount;
  const inputDecimal = decimal(inputUsd);
  const grossProfitUsd = decimal(outputUsd).minus(inputDecimal);
  return {
    direction: input.direction,
    inputUsd: inputDecimal.toFixed(),
    outputUsd: decimal(outputUsd).toFixed(),
    grossProfitUsd: grossProfitUsd.toFixed(),
    grossSpreadPct: grossProfitUsd.dividedBy(inputDecimal).toFixed(),
  };
};
