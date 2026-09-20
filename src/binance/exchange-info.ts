import { z } from "zod";
import type { BinanceExchangeInfo } from "./types.js";

const symbolSchema = z.object({
  symbol: z.string(),
  status: z.string(),
  baseAsset: z.string(),
  quoteAsset: z.string(),
  isSpotTradingAllowed: z.boolean().default(false),
  filters: z.array(z.unknown()).optional(),
}).passthrough();

const exchangeInfoSchema = z.object({
  timezone: z.string(),
  serverTime: z.number(),
  symbols: z.array(symbolSchema),
}).passthrough();

export const parseExchangeInfo = (input: unknown): BinanceExchangeInfo => exchangeInfoSchema.parse(input);
