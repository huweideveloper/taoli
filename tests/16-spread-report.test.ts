import { describe, expect, it } from "vitest";
import { calculateCosts } from "../src/scanner/costs.js";
import { calculateSpread } from "../src/scanner/spread.js";
import { formatArbitrageCalculation } from "../src/scanner/report.js";

describe("spread validation report", () => {
  it("prints both gross and net calculation details", () => {
    const spread = calculateSpread({ direction: "DEX_BUY_BINANCE_SELL", tradeSizeUsd: "1000", dex: { inputAmount: "1000", outputAmount: "500" }, binance: { vwap: "2.1", filledQuantity: "500", quoteAmount: "1050", levelsConsumed: 2, insufficientDepth: false } });
    const costs = calculateCosts({ grossProfitUsd: spread.grossProfitUsd, tradeSizeUsd: "1000", binanceFeeRate: "0.001", gasUsd: "2", executionBufferUsd: "3", rebalanceCostUsd: "4", tokenTax: { includedInQuote: true, additionalCostUsd: "0" }, dexPriceImpact: { includedInQuote: true, additionalCostUsd: "0" } });
    const report = formatArbitrageCalculation({ label: "DEX BUY → BINANCE SELL", dexOutput: "500", binanceVwap: "2.1", spread, costs });
    expect(report).toContain("Gross profit: 50");
    expect(report).toContain("Binance fee: 1");
    expect(report).toContain("Net profit: 40");
    expect(report).toContain("Net spread: 0.04");
  });
});
