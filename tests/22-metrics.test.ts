import { describe, expect, it } from "vitest";
import { percentile, summarizeOpportunityMetrics } from "../src/reports/metrics.js";

describe("long-run metrics", () => {
  it("calculates stable percentile and threshold summaries", () => {
    expect(percentile([100, 200, 300, 400], 0.5)).toBe(250);
    expect(percentile([], 0.9)).toBeNull();
    expect(summarizeOpportunityMetrics([
      { netSpreadPct: "0.004", durationMs: 100, sizeUsd: 100 },
      { netSpreadPct: "0.006", durationMs: 500, sizeUsd: 1000 },
      { netSpreadPct: "0.012", durationMs: 3000, sizeUsd: 3000 },
    ])).toMatchObject({ raw: 3, above03Pct: 3, above05Pct: 2, above1Pct: 1, durationP50Ms: 500, durationP90Ms: 2500 });
  });
});
