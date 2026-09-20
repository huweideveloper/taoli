import { describe, expect, it } from "vitest";
import { scanCandidateOnce } from "../src/scanner/scanner.js";

describe("complete scanner calculation", () => {
  it("combines Binance depth, two DEX quotes, costs, and returns both directions", () => {
    const result = scanCandidateOnce({
      symbol: "CAKEUSDT",
      tradeSizeUsd: "1000",
      ticker: { bidPrice: "2.1", askPrice: "2.2" },
      bids: [{ price: "2.1", quantity: "1000" }],
      asks: [{ price: "2.2", quantity: "1000" }],
      dexBuy: { inputAmount: "1000", outputAmount: "500" },
      dexSell: { inputAmount: "454.54545454", outputAmount: "1020" },
      costs: { binanceFeeRate: "0.001", gasUsd: "2", executionBufferUsd: "1", rebalanceCostUsd: "0", tokenTax: { includedInQuote: true, additionalCostUsd: "0" }, dexPriceImpact: { includedInQuote: true, additionalCostUsd: "0" } },
    });
    expect(result).toHaveLength(2);
    expect(result[0].costs.netProfitUsd.toString()).toBe("46");
    expect(result[1].costs.netProfitUsd.toString()).toBe("16");
    expect(result.every(({ spread }) => spread.direction)).toBe(true);
  });
});
