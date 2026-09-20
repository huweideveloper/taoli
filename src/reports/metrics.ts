export interface OpportunityMetricInput {
  netSpreadPct: string;
  durationMs: number;
  sizeUsd: number;
}

export const percentile = (values: number[], probability: number): number | null => {
  if (values.length === 0) return null;
  if (probability < 0 || probability > 1) throw new Error("probability must be between 0 and 1");
  const sorted = [...values].sort((a, b) => a - b);
  const index = (sorted.length - 1) * probability;
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  if (lower === upper) return sorted[lower];
  return sorted[lower] + (sorted[upper] - sorted[lower]) * (index - lower);
};

export const summarizeOpportunityMetrics = (opportunities: OpportunityMetricInput[]) => {
  const durations = opportunities.map(({ durationMs }) => durationMs);
  const countAt = (threshold: string) => opportunities.filter(({ netSpreadPct }) => Number(netSpreadPct) >= Number(threshold)).length;
  return {
    raw: opportunities.length,
    above03Pct: countAt("0.003"),
    above05Pct: countAt("0.005"),
    above1Pct: countAt("0.01"),
    durationP50Ms: percentile(durations, 0.5),
    durationP90Ms: percentile(durations, 0.9),
    durationP99Ms: percentile(durations, 0.99),
    capacity: Object.fromEntries([100, 500, 1000, 3000].map((size) => [size, opportunities.filter(({ sizeUsd }) => sizeUsd === size).length])),
  };
};
