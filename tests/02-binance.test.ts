import { createServer, type Server } from "node:http";
import { afterEach, describe, expect, it } from "vitest";
import { BinanceClient } from "../src/binance/client.js";
import { parseExchangeInfo } from "../src/binance/exchange-info.js";

let server: Server | undefined;

afterEach(async () => {
  await new Promise<void>((resolve, reject) => {
    if (!server) return resolve();
    server.close((error) => (error ? reject(error) : resolve()));
    server = undefined;
  });
});

describe("Binance Spot REST", () => {
  it("parses structured exchange symbols without relying on symbol suffixes", () => {
    const result = parseExchangeInfo({
      timezone: "UTC",
      serverTime: 1,
      symbols: [
        { symbol: "BTCUSDT", status: "TRADING", baseAsset: "BTC", quoteAsset: "USDT", isSpotTradingAllowed: true },
        { symbol: "FOOUSDT", status: "BREAK", baseAsset: "FOO", quoteAsset: "USDT", isSpotTradingAllowed: false },
      ],
    });

    expect(result.symbols[0]).toMatchObject({ symbol: "BTCUSDT", baseAsset: "BTC", quoteAsset: "USDT" });
    expect(result.symbols[1].status).toBe("BREAK");
  });

  it("retries a transient server error and returns the successful response", async () => {
    let attempts = 0;
    server = createServer((_request, response) => {
      attempts += 1;
      if (attempts === 1) {
        response.writeHead(503, { "content-type": "application/json" });
        response.end(JSON.stringify({ code: -1, msg: "temporary" }));
        return;
      }
      response.writeHead(200, { "content-type": "application/json" });
      response.end(JSON.stringify({ timezone: "UTC", serverTime: 1, symbols: [] }));
    });
    await new Promise<void>((resolve) => server?.listen(0, "127.0.0.1", () => resolve()));
    const address = server.address();
    if (!address || typeof address === "string") throw new Error("test server did not start");

    const result = await new BinanceClient({
      baseUrl: `http://127.0.0.1:${address.port}`,
      timeoutMs: 1_000,
      maxRetries: 1,
      retryDelayMs: 1,
    }).getExchangeInfo();

    expect(result.symbols).toEqual([]);
    expect(attempts).toBe(2);
  });
});
