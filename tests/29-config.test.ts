import { describe, expect, it } from "vitest";
import { scannerConfigFromEnv } from "../config/scanner.js";
import { riskConfigFromEnv } from "../config/risk.js";

describe("configuration overrides", () => {
  it("keeps documented defaults and accepts environment overrides", () => {
    expect(scannerConfigFromEnv({}).tradeSizesUsd).toEqual([100, 500, 1000, 3000]);
    expect(scannerConfigFromEnv({ TRADE_SIZES_USD: "50,250", OKX_CONCURRENCY: "2" })).toMatchObject({ tradeSizesUsd: [50, 250], okxConcurrency: 2 });
    expect(riskConfigFromEnv({ MAX_PRICE_IMPACT_PERCENT: "2", MAX_TOKEN_TAX_RATE: "0.01" })).toMatchObject({ maxPriceImpactPercent: "2", maxTokenTaxRate: "0.01" });
  });
});
