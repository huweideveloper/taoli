import type { ArbitrageCalculation } from "./costs.js";
import type { SpreadResult } from "./spread.js";

export const formatArbitrageCalculation = (input: {
  label: string;
  dexOutput: string;
  binanceVwap: string;
  spread: SpreadResult;
  costs: ArbitrageCalculation;
}) => [
  input.label,
  `DEX output: ${input.dexOutput}`,
  `Binance VWAP: ${input.binanceVwap}`,
  `Gross profit: ${input.spread.grossProfitUsd}`,
  `Gross spread: ${input.spread.grossSpreadPct}`,
  `Binance fee: ${input.costs.binanceFeeUsd.toString()}`,
  `Gas estimate: ${input.costs.gasUsd.toString()}`,
  `Other buffer: ${input.costs.executionBufferUsd.plus(input.costs.rebalanceCostUsd).toString()}`,
  `Estimated costs: ${input.costs.estimatedCostsUsd.toString()}`,
  `Net profit: ${input.costs.netProfitUsd.toString()}`,
  `Net spread: ${input.costs.netSpreadPct.toString()}`,
].join("\n");
