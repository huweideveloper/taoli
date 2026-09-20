import { describe, expect, it } from "vitest";
import { calculateBuyVwap, calculateSellVwap, type OrderBookLevel } from "../src/market/vwap.js";

const asks: OrderBookLevel[] = [
  { price: "2.500", quantity: "100" },
  { price: "2.499", quantity: "200" },
  { price: "2.495", quantity: "400" },
];
const bids: OrderBookLevel[] = [
  { price: "2.500", quantity: "100" },
  { price: "2.499", quantity: "200" },
];

describe("order book VWAP", () => {
  it("calculates buy VWAP for a quote notional across multiple ask levels", () => {
    const result = calculateBuyVwap(asks, { quoteNotional: "700" });
    expect(result.insufficientDepth).toBe(false);
    expect(result.levelsConsumed).toBe(2);
    expect(result.quoteAmount).toBe("700");
    expect(result.vwap).toBe("2.49935705101");
  });

  it("calculates sell VWAP for a base quantity and flags insufficient bids", () => {
    const result = calculateSellVwap(bids, { baseQuantity: "250" });
    expect(result.insufficientDepth).toBe(false);
    expect(result.quoteAmount).toBe("624.85");
    expect(result.vwap).toBe("2.4994");
    expect(calculateSellVwap(bids, { baseQuantity: "400" }).insufficientDepth).toBe(true);
  });

  it("keeps zero amounts representable", () => {
    expect(calculateBuyVwap(asks, { quoteNotional: "0" }).filledQuantity).toBe("0");
  });
});
