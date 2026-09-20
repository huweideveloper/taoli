import { describe, expect, it } from "vitest";
import { discoverUsdtSpotSymbols } from "../src/tokens/discovery.js";

describe("Binance USDT Spot discovery", () => {
  it("keeps only trading spot symbols whose structured quote asset is USDT", () => {
    const symbols = discoverUsdtSpotSymbols({
      timezone: "UTC",
      serverTime: 1,
      symbols: [
        { symbol: "BTCUSDT", baseAsset: "BTC", quoteAsset: "USDT", status: "TRADING", isSpotTradingAllowed: true },
        { symbol: "ETHUSDT", baseAsset: "ETH", quoteAsset: "USDT", status: "BREAK", isSpotTradingAllowed: true },
        { symbol: "FOOUSDT", baseAsset: "FOO", quoteAsset: "USDT", status: "TRADING", isSpotTradingAllowed: false },
        { symbol: "BARBTC", baseAsset: "BAR", quoteAsset: "BTC", status: "TRADING", isSpotTradingAllowed: true },
      ],
    });

    expect(symbols).toEqual([{ symbol: "BTCUSDT", baseAsset: "BTC", quoteAsset: "USDT", status: "TRADING" }]);
  });
});
