export const scannerConfig = {
  tradeSizesUsd: [100, 500, 1000, 3000] as const,
  coarseTriggerPct: 0.003,
  minNetSpreadPct: 0.003,
  okxConcurrency: 4,
  okxTimeoutMs: 5_000,
  opportunityCloseThresholdPct: 0.001,
  binanceDepthLimit: 100,
};
