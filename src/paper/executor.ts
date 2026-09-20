import { decimal } from "../utils/decimal.js";
import { PaperPortfolio, type PaperVenue } from "./portfolio.js";

export type PaperDirection = "DEX_BUY_BINANCE_SELL" | "BINANCE_BUY_DEX_SELL";

export interface PaperExecutionInput {
  symbol: string;
  tokenAsset: string;
  direction: PaperDirection;
  sizeUsd: string;
  now: number;
  quoteObservedAt: number;
  marketObservedAt: number;
  maxQuoteAgeMs: number;
  maxMarketAgeMs: number;
  tokenAmount: string;
  binanceUsd: string;
  binanceFeeUsd: string;
  dexUsd: string;
  gasUsd: string;
}

export interface PaperTradeLeg {
  venue: PaperVenue;
  action: "BUY" | "SELL";
  asset: string;
  amount: string;
  quoteAmount: string;
  feeUsd: string;
}

export interface PaperTrade {
  id: string;
  symbol: string;
  direction: PaperDirection;
  status: "EXECUTED";
  sizeUsd: string;
  gasUsd: string;
  legs: PaperTradeLeg[];
  executedAt: number;
}

export class PaperExecutor {
  private sequence = 0;

  constructor(readonly portfolio: PaperPortfolio) {}

  execute(input: PaperExecutionInput): PaperTrade {
    if (input.now - input.quoteObservedAt > input.maxQuoteAgeMs) throw new Error("quote is stale");
    if (input.now - input.marketObservedAt > input.maxMarketAgeMs) throw new Error("market is stale");
    const tokenAmount = decimal(input.tokenAmount);
    const binanceUsd = decimal(input.binanceUsd);
    const binanceFee = decimal(input.binanceFeeUsd);
    const dexUsd = decimal(input.dexUsd);
    const tokenAsset = input.tokenAsset;
    if (input.direction === "DEX_BUY_BINANCE_SELL") {
      this.requireBalance("BINANCE", tokenAsset, tokenAmount);
      this.requireBalance("BSC", "USDT", dexUsd);
      this.portfolio.debit("BINANCE", tokenAsset, tokenAmount);
      this.portfolio.credit("BINANCE", "USDT", binanceUsd.minus(binanceFee));
      this.portfolio.debit("BSC", "USDT", dexUsd);
      this.portfolio.credit("BSC", tokenAsset, tokenAmount);
      return this.trade(input, [
        { venue: "BINANCE", action: "SELL", asset: tokenAsset, amount: tokenAmount.toString(), quoteAmount: binanceUsd.toString(), feeUsd: binanceFee.toString() },
        { venue: "BSC", action: "BUY", asset: tokenAsset, amount: tokenAmount.toString(), quoteAmount: dexUsd.toString(), feeUsd: input.gasUsd },
      ]);
    }
    this.requireBalance("BINANCE", "USDT", binanceUsd.plus(binanceFee));
    this.requireBalance("BSC", tokenAsset, tokenAmount);
    this.portfolio.debit("BINANCE", "USDT", binanceUsd.plus(binanceFee));
    this.portfolio.credit("BINANCE", tokenAsset, tokenAmount);
    this.portfolio.debit("BSC", tokenAsset, tokenAmount);
    this.portfolio.credit("BSC", "USDT", dexUsd);
    return this.trade(input, [
      { venue: "BINANCE", action: "BUY", asset: tokenAsset, amount: tokenAmount.toString(), quoteAmount: binanceUsd.toString(), feeUsd: binanceFee.toString() },
      { venue: "BSC", action: "SELL", asset: tokenAsset, amount: tokenAmount.toString(), quoteAmount: dexUsd.toString(), feeUsd: input.gasUsd },
    ]);
  }

  private requireBalance(venue: PaperVenue, asset: string, amount: ReturnType<typeof decimal>) {
    if (this.portfolio.balance(venue, asset).lt(amount)) throw new Error(`insufficient ${venue} ${asset} balance`);
  }

  private trade(input: PaperExecutionInput, legs: PaperTradeLeg[]): PaperTrade {
    this.sequence += 1;
    return { id: `paper-${this.sequence}`, symbol: input.symbol, direction: input.direction, status: "EXECUTED", sizeUsd: input.sizeUsd, gasUsd: input.gasUsd, legs, executedAt: input.now };
  }
}
