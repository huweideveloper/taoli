import { describe, expect, it } from "vitest";
import { buildScannerCandidates, type CandidateCheck } from "../src/scanner/candidates.js";

const check = (overrides: Partial<CandidateCheck> = {}): CandidateCheck => ({
  sizeUsd: 1000,
  direction: "USDT_TO_TOKEN",
  success: true,
  priceImpactPercent: "0.5",
  tokenTaxRate: "0.005",
  isHoneypot: false,
  ...overrides,
});

describe("scanner candidate universe", () => {
  it("enables a verified token only when both required sizes and directions pass risk checks", () => {
    const [candidate] = buildScannerCandidates({
      tokenId: 1,
      binanceSymbol: "CAKEUSDT",
      chain: "BSC",
      contractAddress: "0x123",
      identityStatus: "VERIFIED",
      checks: [
        check({ sizeUsd: 1000, direction: "USDT_TO_TOKEN" }),
        check({ sizeUsd: 1000, direction: "TOKEN_TO_USDT" }),
        check({ sizeUsd: 3000, direction: "USDT_TO_TOKEN" }),
        check({ sizeUsd: 3000, direction: "TOKEN_TO_USDT" }),
      ],
    });
    expect(candidate).toMatchObject({ enabled: true, maxTestSize: 3000 });
  });

  it("disables a token when a required quote is a honeypot or exceeds impact", () => {
    const [candidate] = buildScannerCandidates({
      tokenId: 1,
      binanceSymbol: "BADUSDT",
      chain: "BSC",
      contractAddress: "0xbad",
      identityStatus: "VERIFIED",
      checks: [
        check({ sizeUsd: 1000, direction: "USDT_TO_TOKEN" }),
        check({ sizeUsd: 1000, direction: "TOKEN_TO_USDT", isHoneypot: true }),
        check({ sizeUsd: 3000, direction: "USDT_TO_TOKEN", priceImpactPercent: "2" }),
        check({ sizeUsd: 3000, direction: "TOKEN_TO_USDT" }),
      ],
    });
    expect(candidate.enabled).toBe(false);
    expect(candidate.reason).toMatch(/honeypot|price impact/);
  });
});
