import { createServer, type Server } from "node:http";
import { afterEach, describe, expect, it } from "vitest";
import { OkxClient } from "../src/okx/client.js";
import { quoteExactIn } from "../src/okx/quote.js";
import { fromBaseUnits, toBaseUnits } from "../src/utils/decimal.js";

let server: Server | undefined;

afterEach(async () => {
  await new Promise<void>((resolve, reject) => {
    if (!server) return resolve();
    server.close((error) => (error ? reject(error) : resolve()));
    server = undefined;
  });
});

describe("OKX exact-in quote", () => {
  it("converts human amounts through decimal-safe base units", () => {
    expect(toBaseUnits("1.23", 6)).toBe("1230000");
    expect(fromBaseUnits("1230000", 6)).toBe("1.23");
    expect(() => toBaseUnits("1.2345671", 6)).toThrow(/decimals/);
  });

  it("requests a minimal-unit quote and returns latency and effective price", async () => {
    server = createServer((request, response) => {
      const url = new URL(request.url ?? "", "http://localhost");
      expect(url.searchParams.get("amount")).toBe("1000000000000000000000");
      expect(url.searchParams.get("chainIndex")).toBe("56");
      response.writeHead(200, { "content-type": "application/json" });
      response.end(JSON.stringify({ code: "0", msg: "", data: [{
        chainIndex: "56", fromTokenAmount: "1000000000000000000000", toTokenAmount: "500000000000000000000",
        fromToken: { decimal: "18", tokenContractAddress: "0xusdt", tokenSymbol: "USDT", taxRate: "0" },
        toToken: { decimal: "18", tokenContractAddress: "0xcake", tokenSymbol: "CAKE", taxRate: "0.01" },
        priceImpactPercent: "-0.5", estimateGasFee: "100000000000000", tradeFee: "0.1", router: "0xroute",
      }] }));
    });
    await new Promise<void>((resolve) => server?.listen(0, "127.0.0.1", () => resolve()));
    const address = server.address();
    if (!address || typeof address === "string") throw new Error("test server did not start");

    const quote = await quoteExactIn(new OkxClient({
      baseUrl: `http://127.0.0.1:${address.port}`,
      credentials: { apiKey: "key", secretKey: "secret", passphrase: "pass" },
    }), {
      chainIndex: "56", amount: "1000", fromTokenDecimals: 18, toTokenDecimals: 18,
      fromTokenAddress: "0xusdt", toTokenAddress: "0xcake",
    });

    expect(quote.outputAmount).toBe("500");
    expect(quote.effectivePrice).toBe("2");
    expect(quote.tokenTax).toBe("0.01");
    expect(quote.quoteLatencyMs).toBeGreaterThanOrEqual(0);
  });
});
