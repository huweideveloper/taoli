import { describe, expect, it } from "vitest";
import { PaperPortfolio } from "../src/paper/portfolio.js";

describe("paper portfolio", () => {
  it("tracks Binance and BSC balances independently", () => {
    const portfolio = new PaperPortfolio({
      BINANCE: { USDT: "1000", CAKE: "500" },
      BSC: { USDT: "2000", CAKE: "100", BNB: "1" },
    });
    portfolio.debit("BINANCE", "CAKE", "50");
    portfolio.credit("BSC", "CAKE", "50");
    expect(portfolio.balance("BINANCE", "CAKE").toString()).toBe("450");
    expect(portfolio.balance("BSC", "CAKE").toString()).toBe("150");
  });

  it("rejects a debit that would make an inventory negative", () => {
    const portfolio = new PaperPortfolio({ BINANCE: { USDT: "10" }, BSC: {} });
    expect(() => portfolio.debit("BINANCE", "USDT", "11")).toThrow(/insufficient/);
  });
});
