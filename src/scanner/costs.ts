import { decimal, Decimal } from "../utils/decimal.js";

export interface CostInput {
  grossProfitUsd: Decimal.Value;
  tradeSizeUsd: Decimal.Value;
  binanceFeeRate: Decimal.Value;
  gasUsd: Decimal.Value;
  executionBufferUsd: Decimal.Value;
  rebalanceCostUsd: Decimal.Value;
  tokenTax: { includedInQuote: boolean; additionalCostUsd: Decimal.Value };
  dexPriceImpact: { includedInQuote: boolean; additionalCostUsd: Decimal.Value };
}

export interface ArbitrageCalculation {
  grossProfitUsd: Decimal;
  grossSpreadPct: Decimal;
  estimatedCostsUsd: Decimal;
  netProfitUsd: Decimal;
  netSpreadPct: Decimal;
}

export const calculateCosts = (input: CostInput): ArbitrageCalculation => {
  const grossProfitUsd = decimal(input.grossProfitUsd);
  const tradeSizeUsd = decimal(input.tradeSizeUsd);
  const binanceFee = tradeSizeUsd.times(input.binanceFeeRate);
  const quoteExcludedCosts = [
    input.tokenTax.includedInQuote ? decimal(0) : decimal(input.tokenTax.additionalCostUsd),
    input.dexPriceImpact.includedInQuote ? decimal(0) : decimal(input.dexPriceImpact.additionalCostUsd),
  ];
  const estimatedCostsUsd = binanceFee
    .plus(input.gasUsd)
    .plus(input.executionBufferUsd)
    .plus(input.rebalanceCostUsd)
    .plus(quoteExcludedCosts[0])
    .plus(quoteExcludedCosts[1]);
  const netProfitUsd = grossProfitUsd.minus(estimatedCostsUsd);
  return {
    grossProfitUsd,
    grossSpreadPct: grossProfitUsd.dividedBy(tradeSizeUsd),
    estimatedCostsUsd,
    netProfitUsd,
    netSpreadPct: netProfitUsd.dividedBy(tradeSizeUsd),
  };
};
