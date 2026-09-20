import { decimal, type Decimal } from "../utils/decimal.js";
import type { OkxTokenCandidate } from "../okx/token-search.js";
import { matchTokenCandidates } from "./matcher.js";

export type TokenIdentityStatus = "VERIFIED" | "REVIEW" | "CONFLICT" | "NOT_FOUND" | "REJECTED";

export interface TokenValidationInput {
  baseAsset: string;
  candidates: OkxTokenCandidate[];
  binanceReferencePrice?: string;
}

export interface TokenValidation {
  status: TokenIdentityStatus;
  score: number;
  candidate?: OkxTokenCandidate;
  reasons: string[];
}

const MIN_LIQUIDITY = decimal("10000");
const MIN_MARKET_CAP = decimal("1000000");
const MAX_PRICE_DEVIATION = decimal("0.5");
const MIN_HOLDERS = 100;

interface ScoredCandidate {
  candidate: OkxTokenCandidate;
  score: number;
  reasons: string[];
  severePriceMismatch: boolean;
}

const relativeDifference = (left: Decimal, right: Decimal) => left.minus(right).abs().dividedBy(right.abs());

const scoreCandidate = (candidate: OkxTokenCandidate, referencePrice?: string): ScoredCandidate => {
  let score = 40;
  const reasons = ["symbol_exact_match"];
  if (candidate.communityRecognized) {
    score += 25;
    reasons.push("community_recognized");
  }
  if (decimal(candidate.liquidity).gte(MIN_LIQUIDITY)) {
    score += 15;
    reasons.push("liquidity_above_threshold");
  }
  if (decimal(candidate.marketCap).gte(MIN_MARKET_CAP)) {
    score += 10;
    reasons.push("market_cap_above_threshold");
  }
  if (Number(candidate.holders) >= MIN_HOLDERS) {
    score += 5;
    reasons.push("holders_above_threshold");
  }

  let severePriceMismatch = false;
  if (referencePrice && decimal(referencePrice).gt(0) && decimal(candidate.price).gt(0)) {
    if (relativeDifference(decimal(candidate.price), decimal(referencePrice)).lte(MAX_PRICE_DEVIATION)) {
      score += 5;
      reasons.push("reference_price_consistent");
    } else {
      severePriceMismatch = true;
      reasons.push("reference_price_conflict");
    }
  }
  return { candidate, score, reasons, severePriceMismatch };
};

export const validateTokenIdentity = (input: TokenValidationInput): TokenValidation => {
  const matches = matchTokenCandidates(input.baseAsset, input.candidates);
  if (matches.length === 0) return { status: "NOT_FOUND", score: 0, reasons: ["no_exact_bsc_symbol_match"] };
  const scored = matches.map((candidate) => scoreCandidate(candidate, input.binanceReferencePrice)).sort((a, b) => b.score - a.score);
  const [best, second] = scored;
  if (best.severePriceMismatch) return { status: "REJECTED", score: best.score, candidate: best.candidate, reasons: best.reasons };
  if (best.score >= 70 && second?.score >= 70) return { status: "CONFLICT", score: best.score, candidate: best.candidate, reasons: ["multiple_high_confidence_candidates"] };
  if (best.score >= 70) return { status: "VERIFIED", score: best.score, candidate: best.candidate, reasons: best.reasons };
  if (best.score >= 40) return { status: "REVIEW", score: best.score, candidate: best.candidate, reasons: best.reasons };
  return { status: "REJECTED", score: best.score, candidate: best.candidate, reasons: best.reasons };
};
