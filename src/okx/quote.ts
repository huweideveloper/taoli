import { z } from "zod";
import type { OkxClient } from "./client.js";
import { decimal, fromBaseUnits, toBaseUnits } from "../utils/decimal.js";

export interface QuoteExactInInput {
  chainIndex: string;
  amount: string;
  fromTokenDecimals: number;
  toTokenDecimals: number;
  fromTokenAddress: string;
  toTokenAddress: string;
}

export interface DexQuote {
  chainIndex: string;
  inputAmount: string;
  outputAmount: string;
  effectivePrice: string;
  priceImpact: string | null;
  tokenTax: string;
  estimateGasFee: string;
  tradeFee: string;
  route: string;
  quoteLatencyMs: number;
  raw: unknown;
}

export type QuoteDirection = "USDT_TO_TOKEN" | "TOKEN_TO_USDT";

export interface TwoWayQuoteInput {
  chainIndex: string;
  tokenPriceUsd: string;
  fromTokenDecimals: number;
  tokenDecimals: number;
  usdtAddress: string;
  tokenAddress: string;
  sizesUsd: readonly number[];
}

export interface TwoWayQuote extends DexQuote {
  sizeUsd: number;
  direction: QuoteDirection;
}

const tokenSchema = z.object({
  decimal: z.string(),
  tokenContractAddress: z.string(),
  tokenSymbol: z.string(),
  taxRate: z.string().nullable().optional(),
}).passthrough();

const quoteSchema = z.object({
  chainIndex: z.string(),
  fromTokenAmount: z.string(),
  toTokenAmount: z.string(),
  fromToken: tokenSchema,
  toToken: tokenSchema,
  priceImpactPercent: z.string().nullable().optional(),
  estimateGasFee: z.string().default("0"),
  tradeFee: z.string().default("0"),
  router: z.string().default(""),
}).passthrough();

export const quoteExactIn = async (client: OkxClient, input: QuoteExactInInput): Promise<DexQuote> => {
  const startedAt = Date.now();
  const data = await client.get<unknown>("/api/v6/dex/aggregator/quote", {
    chainIndex: input.chainIndex,
    amount: toBaseUnits(input.amount, input.fromTokenDecimals),
    fromTokenAddress: input.fromTokenAddress,
    toTokenAddress: input.toTokenAddress,
    swapMode: "exactIn",
  });
  const quote = quoteSchema.parse(Array.isArray(data) ? data[0] : undefined);
  const inputAmount = fromBaseUnits(quote.fromTokenAmount, input.fromTokenDecimals);
  const outputAmount = fromBaseUnits(quote.toTokenAmount, input.toTokenDecimals);
  const effectivePrice = decimal(inputAmount).dividedBy(outputAmount).toFixed();
  const fromTax = decimal(quote.fromToken.taxRate ?? "0");
  const toTax = decimal(quote.toToken.taxRate ?? "0");
  return {
    chainIndex: quote.chainIndex,
    inputAmount,
    outputAmount,
    effectivePrice,
    priceImpact: quote.priceImpactPercent ?? null,
    tokenTax: (fromTax.gte(toTax) ? fromTax : toTax).toFixed(),
    estimateGasFee: quote.estimateGasFee,
    tradeFee: quote.tradeFee,
    route: quote.router,
    quoteLatencyMs: Date.now() - startedAt,
    raw: quote,
  };
};

export const quoteBothDirections = async (client: OkxClient, input: TwoWayQuoteInput): Promise<TwoWayQuote[]> => {
  const results: TwoWayQuote[] = [];
  for (const sizeUsd of input.sizesUsd) {
    const buy = await quoteExactIn(client, {
      chainIndex: input.chainIndex,
      amount: String(sizeUsd),
      fromTokenDecimals: input.fromTokenDecimals,
      toTokenDecimals: input.tokenDecimals,
      fromTokenAddress: input.usdtAddress,
      toTokenAddress: input.tokenAddress,
    });
    results.push({ ...buy, sizeUsd, direction: "USDT_TO_TOKEN" });

    const tokenAmount = decimal(sizeUsd).dividedBy(input.tokenPriceUsd);
    if (tokenAmount.decimalPlaces() > input.tokenDecimals) throw new Error("token reference amount exceeds token decimals");
    const sell = await quoteExactIn(client, {
      chainIndex: input.chainIndex,
      amount: tokenAmount.toFixed(),
      fromTokenDecimals: input.tokenDecimals,
      toTokenDecimals: input.fromTokenDecimals,
      fromTokenAddress: input.tokenAddress,
      toTokenAddress: input.usdtAddress,
    });
    results.push({ ...sell, sizeUsd, direction: "TOKEN_TO_USDT" });
  }
  return results;
};
