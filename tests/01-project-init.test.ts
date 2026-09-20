import { describe, expect, it } from "vitest";
import { scannerConfig } from "../config/scanner.js";
import { decimal, one } from "../src/utils/decimal.js";

describe("project initialization", () => {
  it("exposes scanner defaults and exact decimal arithmetic", () => {
    expect(scannerConfig.tradeSizesUsd).toEqual([100, 500, 1000, 3000]);
    expect(decimal("0.1").plus("0.2").toString()).toBe("0.3");
    expect(one().toString()).toBe("1");
  });
});
