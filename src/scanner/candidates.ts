import { riskConfig } from "../../config/risk.js";
import { decimal } from "../utils/decimal.js";
import type { TokenIdentityStatus } from "../tokens/validator.js";

export interface CandidateCheck {
  sizeUsd: number;
  direction: "USDT_TO_TOKEN" | "TOKEN_TO_USDT";
  success: boolean;
  priceImpactPercent: string;
  tokenTaxRate: string;
  isHoneypot: boolean;
}

export interface CandidateInput {
  tokenId: number;
  binanceSymbol: string;
  chain: string;
  contractAddress: string;
  identityStatus: TokenIdentityStatus;
  checks: CandidateCheck[];
}

export interface ScannerCandidate {
  tokenId: number;
  binanceSymbol: string;
  chain: string;
  contractAddress: string;
  enabled: boolean;
  maxTestSize: number;
  reason: string;
}

const requiredChecks = riskConfig.requiredQuoteSizesUsd.flatMap((sizeUsd) => [
  { sizeUsd, direction: "USDT_TO_TOKEN" as const },
  { sizeUsd, direction: "TOKEN_TO_USDT" as const },
]);

const buildOne = (input: CandidateInput): ScannerCandidate => {
  if (input.identityStatus !== "VERIFIED") return { ...input, enabled: false, maxTestSize: 0, reason: `identity status ${input.identityStatus}` };
  for (const required of requiredChecks) {
    const check = input.checks.find(({ sizeUsd, direction }) => sizeUsd === required.sizeUsd && direction === required.direction);
    if (!check) return { ...input, enabled: false, maxTestSize: 0, reason: `missing quote ${required.sizeUsd} ${required.direction}` };
    if (!check.success) return { ...input, enabled: false, maxTestSize: 0, reason: `quote failed ${required.sizeUsd} ${required.direction}` };
    if (check.isHoneypot) return { ...input, enabled: false, maxTestSize: 0, reason: "honeypot detected" };
    if (decimal(check.priceImpactPercent).abs().gt(riskConfig.maxPriceImpactPercent)) return { ...input, enabled: false, maxTestSize: 0, reason: `price impact above ${riskConfig.maxPriceImpactPercent}%` };
    if (decimal(check.tokenTaxRate).gt(riskConfig.maxTokenTaxRate)) return { ...input, enabled: false, maxTestSize: 0, reason: `token tax above ${riskConfig.maxTokenTaxRate}` };
  }
  return { ...input, enabled: true, maxTestSize: Math.max(...riskConfig.requiredQuoteSizesUsd), reason: "all candidate checks passed" };
};

export const buildScannerCandidates = (input: CandidateInput | CandidateInput[]): ScannerCandidate[] => (Array.isArray(input) ? input : [input]).map(buildOne);
