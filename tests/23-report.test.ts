import { describe, expect, it } from "vitest";
import { format72HourReport } from "../src/reports/summary.js";

describe("72 hour report", () => {
  it("distinguishes observed data from executable-looking estimates", () => {
    const report = format72HourReport({
      candidates: 82,
      summary: { raw: 3, above03Pct: 3, above05Pct: 2, above1Pct: 1, durationP50Ms: 210, durationP90Ms: 1800, durationP99Ms: 7300, capacity: { 100: 2, 500: 1, 1000: 1, 3000: 0 } },
      executableLooking: { 100: 2, 500: 1, 1000: 1, 3000: 0 },
    });
    expect(report).toContain("Observed");
    expect(report).toContain("Actually Executable-looking");
    expect(report).toContain("Net > 0.5%: 2");
    expect(report).toContain("$3000: 0");
  });
});
