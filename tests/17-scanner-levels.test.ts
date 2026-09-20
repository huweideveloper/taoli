import { describe, expect, it } from "vitest";
import { shouldTriggerPreciseScan } from "../src/scanner/coarse-scanner.js";
import { PreciseQuoteScanner } from "../src/scanner/quote-scanner.js";

describe("two-level scanner", () => {
  it("only triggers precise quotes above the coarse threshold", () => {
    expect(shouldTriggerPreciseScan("2.00", "2.01", "0.003")).toBe(true);
    expect(shouldTriggerPreciseScan("2.00", "2.004", "0.003")).toBe(false);
  });

  it("deduplicates pending work and reuses a fresh cache entry", async () => {
    let now = 1_000;
    let calls = 0;
    let active = 0;
    let maxActive = 0;
    const scanner = new PreciseQuoteScanner(async (key) => {
      calls += 1;
      active += 1;
      maxActive = Math.max(maxActive, active);
      await Promise.resolve();
      active -= 1;
      return { key, observedAt: now > 1_000 ? now - 100 : now, value: calls };
    }, { concurrency: 1, cacheTtlMs: 100, cooldownMs: 500, staleMs: 50, now: () => now });

    const [first, duplicate] = await Promise.all([scanner.request("CAKE:1000"), scanner.request("CAKE:1000")]);
    expect(first?.value).toBe(1);
    expect(duplicate?.value).toBe(1);
    expect(calls).toBe(1);
    expect(maxActive).toBe(1);
    expect((await scanner.request("CAKE:1000"))?.value).toBe(1);

    now += 200;
    expect(await scanner.request("CAKE:1000")).toBeUndefined();
    now += 400;
    expect(await scanner.request("CAKE:1000")).toBeUndefined();
  });
});
