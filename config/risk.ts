export const riskConfig = {
  maxPriceImpactPercent: "1",
  maxTokenTaxRate: "0.02",
  minLiquidityUsd: "10000",
  requiredQuoteSizesUsd: [1000, 3000] as const,
} as const;
