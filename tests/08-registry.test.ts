import { describe, expect, it } from "vitest";
import { buildTokenRegistry } from "../src/tokens/registry.js";

describe("Token Registry", () => {
  it("persists the validation status per Binance symbol without treating missing tokens as verified", () => {
    const registry = buildTokenRegistry([
      { symbol: "CAKEUSDT", baseAsset: "CAKE", quoteAsset: "USDT", status: "TRADING" },
      { symbol: "MISSINGUSDT", baseAsset: "MISSING", quoteAsset: "USDT", status: "TRADING" },
    ], (asset) => asset === "CAKE" ? [{
      chainIndex: "56", tokenName: "PancakeSwap Token", tokenSymbol: "CAKE", tokenContractAddress: "0x123", decimal: "18",
      price: "2", liquidity: "1000000", marketCap: "500000000", holders: "100000", communityRecognized: true,
    }] : []);

    expect(registry).toHaveLength(2);
    expect(registry[0]).toMatchObject({ symbol: "CAKEUSDT", status: "VERIFIED", contractAddress: "0x123" });
    expect(registry[1]).toMatchObject({ symbol: "MISSINGUSDT", status: "NOT_FOUND" });
  });
});
