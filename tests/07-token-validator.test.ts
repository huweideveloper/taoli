import { describe, expect, it } from "vitest";
import { validateTokenIdentity, type TokenValidationInput } from "../src/tokens/validator.js";

const candidate = (overrides: Partial<TokenValidationInput["candidates"][number]> = {}) => ({
  chainIndex: "56",
  tokenName: "PancakeSwap Token",
  tokenSymbol: "CAKE",
  tokenContractAddress: "0x123",
  decimal: "18",
  price: "2.10",
  liquidity: "1000000",
  marketCap: "500000000",
  holders: "100000",
  communityRecognized: true,
  ...overrides,
});

const input = (candidates: TokenValidationInput["candidates"], overrides: Partial<TokenValidationInput> = {}): TokenValidationInput => ({
  baseAsset: "CAKE",
  binanceReferencePrice: "2.00",
  candidates,
  ...overrides,
});

describe("Token identity validator", () => {
  it("verifies a recognized liquid candidate with a consistent reference price", () => {
    expect(validateTokenIdentity(input([candidate()])).status).toBe("VERIFIED");
  });

  it("marks two high-confidence candidates as a conflict", () => {
    const result = validateTokenIdentity(input([candidate(), candidate({ tokenContractAddress: "0x456" })]));
    expect(result.status).toBe("CONFLICT");
  });

  it("returns NOT_FOUND when no candidate has the requested symbol", () => {
    expect(validateTokenIdentity(input([candidate({ tokenSymbol: "SYRUP" })])).status).toBe("NOT_FOUND");
  });

  it("rejects an otherwise matching candidate with a severe price mismatch", () => {
    expect(validateTokenIdentity(input([candidate({ price: "200" })])).status).toBe("REJECTED");
  });
});
