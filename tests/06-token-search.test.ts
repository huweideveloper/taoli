import { createServer, type Server } from "node:http";
import { afterEach, describe, expect, it } from "vitest";
import { OkxClient } from "../src/okx/client.js";
import { searchTokenCandidates } from "../src/okx/token-search.js";

let server: Server | undefined;

afterEach(async () => {
  await new Promise<void>((resolve, reject) => {
    if (!server) return resolve();
    server.close((error) => (error ? reject(error) : resolve()));
    server = undefined;
  });
});

describe("OKX token search", () => {
  it("requests BSC candidates and preserves identity and market fields", async () => {
    server = createServer((request, response) => {
      expect(request.url).toBe("/api/v6/dex/market/token/search?chains=56&search=CAKE");
      response.writeHead(200, { "content-type": "application/json" });
      response.end(JSON.stringify({
        code: "0",
        msg: "",
        data: [{
          chainIndex: "56",
          tokenName: "PancakeSwap Token",
          tokenSymbol: "CAKE",
          tokenContractAddress: "0x123",
          decimal: "18",
          price: "2.1",
          liquidity: "1000000",
          marketCap: "500000000",
          holders: "100000",
          communityRecognized: true,
        }],
      }));
    });
    await new Promise<void>((resolve) => server?.listen(0, "127.0.0.1", () => resolve()));
    const address = server.address();
    if (!address || typeof address === "string") throw new Error("test server did not start");

    const result = await searchTokenCandidates(
      new OkxClient({ baseUrl: `http://127.0.0.1:${address.port}`, credentials: { apiKey: "key", secretKey: "secret", passphrase: "pass" } }),
      "CAKE",
    );
    expect(result[0]).toMatchObject({ tokenSymbol: "CAKE", tokenContractAddress: "0x123", decimal: "18", communityRecognized: true });
  });
});
