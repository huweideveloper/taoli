import { describe, expect, it } from "vitest";
import { calculateCosts, type CostInput } from "../src/scanner/costs.js";

describe("arbitrage cost engine", () => {
  it("subtracts additional costs and does not double count quote-included costs", () => {
    const input: CostInput = {
      grossProfitUsd: "50",
      tradeSizeUsd: "1000",
      binanceFeeRate: "0.001",
      gasUsd: "2",
      executionBufferUsd: "3",
      rebalanceCostUsd: "4",
      tokenTax: { includedInQuote: true, additionalCostUsd: "0" },
      dexPriceImpact: { includedInQuote: true, additionalCostUsd: "0" },
    };
    const result = calculateCosts(input);
    expect(result.estimatedCostsUsd.toString()).toBe("10");
    expect(result.netProfitUsd.toString()).toBe("40");
    expect(result.netSpreadPct.toString()).toBe("0.04");
  });

  it("includes a cost only when the quote did not already include it", () => {
    const result = calculateCosts({
      grossProfitUsd: "50", tradeSizeUsd: "1000", binanceFeeRate: "0.001", gasUsd: "0", executionBufferUsd: "0", rebalanceCostUsd: "0",
      tokenTax: { includedInQuote: false, additionalCostUsd: "5" }, dexPriceImpact: { includedInQuote: false, additionalCostUsd: "7" },
    });
    expect(result.estimatedCostsUsd.toString()).toBe("13");
    expect(result.netProfitUsd.toString()).toBe("37");
  });
});
