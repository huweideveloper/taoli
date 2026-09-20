import type { OkxTokenCandidate } from "../okx/token-search.js";

export const matchTokenCandidates = (baseAsset: string, candidates: OkxTokenCandidate[]) => candidates.filter(
  ({ tokenSymbol, chainIndex }) => chainIndex === "56" && tokenSymbol.toUpperCase() === baseAsset.toUpperCase(),
);
