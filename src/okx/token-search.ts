import { z } from "zod";
import type { OkxClient } from "./client.js";

export interface OkxTokenCandidate {
  chainIndex: string;
  tokenName: string;
  tokenSymbol: string;
  tokenContractAddress: string;
  decimal: string;
  price: string;
  liquidity: string;
  marketCap: string;
  holders: string;
  communityRecognized: boolean;
}

const tokenSchema = z.object({
  chainIndex: z.string(),
  tokenName: z.string(),
  tokenSymbol: z.string(),
  tokenContractAddress: z.string(),
  decimal: z.string(),
  price: z.string(),
  liquidity: z.string(),
  marketCap: z.string(),
  holders: z.string(),
  communityRecognized: z.boolean().default(false),
}).passthrough();

export const parseTokenCandidates = (input: unknown): OkxTokenCandidate[] => z.array(tokenSchema).parse(input);

export const searchTokenCandidates = async (client: OkxClient, symbol: string, chainIndex = "56") => parseTokenCandidates(
  await client.get<unknown>("/api/v6/dex/market/token/search", { chains: chainIndex, search: symbol }),
);
