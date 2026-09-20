import { describe, expect, it } from "vitest";
import { calculateSpread, type SpreadInput } from "../src/scanner/spread.js";

const binance = { vwap: "2.1", filledQuantity: "500", quoteAmount: "1050", levelsConsumed: 2, insufficientDepth: false };

describe("gross spread calculator", () => {
  it("calculates DEX buy then Binance sell from final USDT proceeds", () => {
    const result = calculateSpread({
      direction: "DEX_BUY_BINANCE_SELL",
      tradeSizeUsd: "1000",
      dex: { inputAmount: "1000", outputAmount: "500" },
      binance: binance,
    });
    expect(result.grossProfitUsd).toBe("50");
    expect(result.grossSpreadPct).toBe("0.05");
  });

  it("calculates Binance buy then DEX sell from final DEX output", () => {
    const result = calculateSpread({
      direction: "BINANCE_BUY_DEX_SELL",
      tradeSizeUsd: "1000",
      dex: { inputAmount: "476.19047619", outputAmount: "1020" },
      binance: { ...binance, quoteAmount: "1000", filledQuantity: "476.19047619" },
    });
    expect(result.grossProfitUsd).toBe("20");
    expect(result.grossSpreadPct).toBe("0.02");
  });

  it("refuses a spread when Binance depth cannot fill the leg", () => {
    const input: SpreadInput = { direction: "DEX_BUY_BINANCE_SELL", tradeSizeUsd: "1000", dex: { inputAmount: "1000", outputAmount: "500" }, binance: { ...binance, insufficientDepth: true } };
    expect(() => calculateSpread(input)).toThrow(/insufficient depth/);
  });
});
