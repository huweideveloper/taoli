import type { BinanceExchangeInfo } from "../binance/types.js";

export interface BinanceSpotSymbol {
  symbol: string;
  baseAsset: string;
  quoteAsset: string;
  status: string;
}

export const discoverUsdtSpotSymbols = (exchangeInfo: BinanceExchangeInfo): BinanceSpotSymbol[] => exchangeInfo.symbols
  .filter(({ quoteAsset, status, isSpotTradingAllowed }) => quoteAsset === "USDT" && status === "TRADING" && isSpotTradingAllowed)
  .map(({ symbol, baseAsset, quoteAsset, status }) => ({ symbol, baseAsset, quoteAsset, status }));
