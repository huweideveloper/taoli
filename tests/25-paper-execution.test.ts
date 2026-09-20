import { describe, expect, it } from "vitest";
import { PaperExecutor } from "../src/paper/executor.js";
import { PaperPortfolio } from "../src/paper/portfolio.js";

const create = () => new PaperExecutor(new PaperPortfolio({ BINANCE: { USDT: "1000", CAKE: "500" }, BSC: { USDT: "1000", CAKE: "100", BNB: "1" } }));

describe("paper execution", () => {
  it("simulates both legs and updates the two venue inventories", () => {
    const executor = create();
    const trade = executor.execute({
      symbol: "CAKEUSDT", tokenAsset: "CAKE", direction: "DEX_BUY_BINANCE_SELL", sizeUsd: "100", now: 1_000, quoteObservedAt: 950, marketObservedAt: 950,
      maxQuoteAgeMs: 100, maxMarketAgeMs: 100, tokenAmount: "50", binanceUsd: "105", binanceFeeUsd: "1", dexUsd: "100", gasUsd: "1",
    });
    expect(trade.status).toBe("EXECUTED");
    expect(trade.legs).toHaveLength(2);
    expect(executor.portfolio.balance("BINANCE", "CAKE").toString()).toBe("450");
    expect(executor.portfolio.balance("BSC", "CAKE").toString()).toBe("150");
  });

  it("rejects stale quotes without changing balances", () => {
    const executor = create();
    expect(() => executor.execute({
      symbol: "CAKEUSDT", tokenAsset: "CAKE", direction: "DEX_BUY_BINANCE_SELL", sizeUsd: "100", now: 1_000, quoteObservedAt: 800, marketObservedAt: 950,
      maxQuoteAgeMs: 100, maxMarketAgeMs: 100, tokenAmount: "50", binanceUsd: "105", binanceFeeUsd: "1", dexUsd: "100", gasUsd: "1",
    })).toThrow(/quote is stale/);
    expect(executor.portfolio.balance("BINANCE", "CAKE").toString()).toBe("500");
  });
});
