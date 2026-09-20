import { describe, expect, it } from "vitest";
import { assertLiveTradingUnavailable } from "../src/execution/index.js";

describe("live trading boundary", () => {
  it("fails closed in V1", () => {
    expect(() => assertLiveTradingUnavailable()).toThrow(/disabled in V1/);
  });
});
