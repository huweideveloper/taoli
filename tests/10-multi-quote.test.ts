import { createServer, type Server } from "node:http";
import { afterEach, describe, expect, it } from "vitest";
import { OkxClient } from "../src/okx/client.js";
import { quoteBothDirections } from "../src/okx/quote.js";

let server: Server | undefined;

afterEach(async () => {
  await new Promise<void>((resolve, reject) => {
    if (!server) return resolve();
    server.close((error) => (error ? reject(error) : resolve()));
    server = undefined;
  });
});

describe("multi-size two-way quotes", () => {
  it("quotes every configured USD size in both directions", async () => {
    const requested: string[] = [];
    server = createServer((request, response) => {
      const url = new URL(request.url ?? "", "http://localhost");
      const from = url.searchParams.get("fromTokenAddress") ?? "";
      requested.push(from);
      const reverse = from === "0xcake";
      response.writeHead(200, { "content-type": "application/json" });
      response.end(JSON.stringify({ code: "0", msg: "", data: [{
        chainIndex: "56", fromTokenAmount: reverse ? "50000000000000000000" : "100000000000000000000",
        toTokenAmount: reverse ? "100000000000000000000" : "50000000000000000000",
        fromToken: { decimal: "18", tokenContractAddress: from, tokenSymbol: reverse ? "CAKE" : "USDT", taxRate: "0" },
        toToken: { decimal: "18", tokenContractAddress: reverse ? "0xusdt" : "0xcake", tokenSymbol: reverse ? "USDT" : "CAKE", taxRate: "0" },
        priceImpactPercent: "-0.5", estimateGasFee: "1", tradeFee: "0", router: "route",
      }] }));
    });
    await new Promise<void>((resolve) => server?.listen(0, "127.0.0.1", () => resolve()));
    const address = server.address();
    if (!address || typeof address === "string") throw new Error("test server did not start");
    const result = await quoteBothDirections(new OkxClient({
      baseUrl: `http://127.0.0.1:${address.port}`,
      credentials: { apiKey: "key", secretKey: "secret", passphrase: "pass" },
    }), {
      chainIndex: "56", tokenPriceUsd: "2", fromTokenDecimals: 18, tokenDecimals: 18,
      usdtAddress: "0xusdt", tokenAddress: "0xcake", sizesUsd: [100, 500],
    });

    expect(result).toHaveLength(4);
    expect(result.map(({ direction }) => direction)).toEqual(["USDT_TO_TOKEN", "TOKEN_TO_USDT", "USDT_TO_TOKEN", "TOKEN_TO_USDT"]);
    expect(result[1].inputAmount).toBe("50");
    expect(requested).toEqual(["0xusdt", "0xcake", "0xusdt", "0xcake"]);
  });
});
