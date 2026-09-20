export interface BinanceSymbolInfo {
  symbol: string;
  status: string;
  baseAsset: string;
  quoteAsset: string;
  isSpotTradingAllowed: boolean;
  filters?: unknown[];
}

export interface BinanceExchangeInfo {
  timezone: string;
  serverTime: number;
  symbols: BinanceSymbolInfo[];
}

export interface BinanceDepth {
  lastUpdateId: number;
  bids: [string, string][];
  asks: [string, string][];
}
