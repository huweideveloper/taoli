const nonNegativeDecimal = (value: string | undefined, fallback: string) => {
  const parsed = value === undefined ? Number(fallback) : Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) throw new Error("risk config must be non-negative");
  return value ?? fallback;
};

export const riskConfigFromEnv = (env: NodeJS.ProcessEnv) => ({
  maxPriceImpactPercent: nonNegativeDecimal(env.MAX_PRICE_IMPACT_PERCENT, "1"),
  maxTokenTaxRate: nonNegativeDecimal(env.MAX_TOKEN_TAX_RATE, "0.02"),
  minLiquidityUsd: nonNegativeDecimal(env.MIN_LIQUIDITY_USD, "10000"),
  requiredQuoteSizesUsd: (env.REQUIRED_QUOTE_SIZES_USD ?? "1000,3000").split(",").map((value) => Number(value.trim())),
});

export const riskConfig = riskConfigFromEnv(process.env);
