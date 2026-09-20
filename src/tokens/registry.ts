import type { BinanceSpotSymbol } from "./discovery.js";
import { validateTokenIdentity, type TokenIdentityStatus } from "./validator.js";
import type { OkxTokenCandidate } from "../okx/token-search.js";

export interface TokenRegistryEntry {
  symbol: string;
  baseAsset: string;
  chain: "BSC";
  status: TokenIdentityStatus;
  score: number;
  reasons: string[];
  contractAddress?: string;
  decimals?: number;
  tokenName?: string;
}

export const buildTokenRegistry = (
  symbols: BinanceSpotSymbol[],
  candidateLookup: (baseAsset: string) => OkxTokenCandidate[],
  referencePrices: Record<string, string> = {},
): TokenRegistryEntry[] => symbols.map((symbol) => {
  const validation = validateTokenIdentity({
    baseAsset: symbol.baseAsset,
    candidates: candidateLookup(symbol.baseAsset),
    binanceReferencePrice: referencePrices[symbol.symbol],
  });
  return {
    symbol: symbol.symbol,
    baseAsset: symbol.baseAsset,
    chain: "BSC",
    status: validation.status,
    score: validation.score,
    reasons: validation.reasons,
    contractAddress: validation.candidate?.tokenContractAddress,
    decimals: validation.candidate ? Number(validation.candidate.decimal) : undefined,
    tokenName: validation.candidate?.tokenName,
  };
});
