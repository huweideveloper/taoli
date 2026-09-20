import { describe, expect, it } from "vitest";
import { OpportunityLifecycle } from "../src/scanner/opportunity.js";

describe("opportunity lifecycle", () => {
  it("deduplicates the same symbol/direction/size and closes below threshold", () => {
    const lifecycle = new OpportunityLifecycle({ openThresholdPct: "0.003", closeThresholdPct: "0.001" });
    expect(lifecycle.observe({ key: "CAKEUSDT|DEX_BUY_BINANCE_SELL|1000", netSpreadPct: "0.005", netProfitUsd: "5", observedAt: 1_000 })).toMatchObject({ status: "OPEN", firstSeenAt: 1_000, lastSeenAt: 1_000, durationMs: 0 });
    expect(lifecycle.observe({ key: "CAKEUSDT|DEX_BUY_BINANCE_SELL|1000", netSpreadPct: "0.004", netProfitUsd: "4", observedAt: 1_500 })).toMatchObject({ status: "UPDATED", firstSeenAt: 1_000, lastSeenAt: 1_500, durationMs: 500 });
    expect(lifecycle.observe({ key: "CAKEUSDT|DEX_BUY_BINANCE_SELL|1000", netSpreadPct: "0.0005", netProfitUsd: "0.5", observedAt: 2_000 })).toMatchObject({ status: "CLOSED", durationMs: 1_000 });
    expect(lifecycle.size).toBe(0);
  });

  it("ignores observations that never reach the open threshold", () => {
    const lifecycle = new OpportunityLifecycle({ openThresholdPct: "0.003", closeThresholdPct: "0.001" });
    expect(lifecycle.observe({ key: "X", netSpreadPct: "0.002", netProfitUsd: "1", observedAt: 1 })).toBeUndefined();
  });
});
