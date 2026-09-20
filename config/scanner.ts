const positiveInt = (value: string | undefined, fallback: number) => {
  const parsed = value === undefined ? fallback : Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) throw new Error("scanner integer config must be positive");
  return parsed;
};

const nonNegativeNumber = (value: string | undefined, fallback: number) => {
  const parsed = value === undefined ? fallback : Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) throw new Error("scanner numeric config must be non-negative");
  return parsed;
};

export const scannerConfigFromEnv = (env: NodeJS.ProcessEnv) => ({
  tradeSizesUsd: (env.TRADE_SIZES_USD ?? "100,500,1000,3000").split(",").map((value) => positiveInt(value.trim(), 1)),
  coarseTriggerPct: nonNegativeNumber(env.COARSE_TRIGGER_PCT, 0.003),
  minNetSpreadPct: nonNegativeNumber(env.MIN_NET_SPREAD_PCT, 0.003),
  okxConcurrency: positiveInt(env.OKX_CONCURRENCY, 4),
  okxTimeoutMs: positiveInt(env.OKX_TIMEOUT_MS, 5_000),
  opportunityCloseThresholdPct: nonNegativeNumber(env.OPPORTUNITY_CLOSE_THRESHOLD_PCT, 0.001),
  binanceDepthLimit: positiveInt(env.BINANCE_DEPTH_LIMIT, 100),
});

export const scannerConfig = scannerConfigFromEnv(process.env);
