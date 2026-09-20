import { createServer, type Server } from "node:http";
import { afterEach, describe, expect, it } from "vitest";
import { OkxClient } from "../src/okx/client.js";
import { signOkxRequest, type OkxCredentials } from "../src/okx/auth.js";

let server: Server | undefined;

afterEach(async () => {
  await new Promise<void>((resolve, reject) => {
    if (!server) return resolve();
    server.close((error) => (error ? reject(error) : resolve()));
    server = undefined;
  });
});

const credentials: OkxCredentials = { apiKey: "key", secretKey: "secret", passphrase: "pass" };

describe("OKX OnchainOS authentication", () => {
  it("creates the documented HMAC-SHA256 base64 signature", () => {
    expect(signOkxRequest({
      credentials,
      timestamp: "2020-12-08T09:08:57.715Z",
      method: "GET",
      requestPath: "/api/v6/dex/aggregator/swap",
    })).toBe("5M9TfqaHeluqkynw6VxqyVdhYHi4A4QRj+5aA63JulA=");
  });

  it("signs a GET request and unwraps a successful OKX envelope", async () => {
    server = createServer((request, response) => {
      const timestamp = request.headers["ok-access-timestamp"];
      const expected = signOkxRequest({ credentials, timestamp: String(timestamp), method: "GET", requestPath: request.url ?? "" });
      expect(request.headers["ok-access-key"]).toBe("key");
      expect(request.headers["ok-access-sign"]).toBe(expected);
      response.writeHead(200, { "content-type": "application/json" });
      response.end(JSON.stringify({ code: "0", msg: "", data: [{ chainIndex: "56" }] }));
    });
    await new Promise<void>((resolve) => server?.listen(0, "127.0.0.1", () => resolve()));
    const address = server.address();
    if (!address || typeof address === "string") throw new Error("test server did not start");

    const result = await new OkxClient({ baseUrl: `http://127.0.0.1:${address.port}`, credentials }).get("/api/v6/test", { chains: "56" });
    expect(result).toEqual([{ chainIndex: "56" }]);
  });
});
