import type { BinanceBookTicker } from "../binance/book-ticker.js";

export class BookTickerStore {
  private readonly values = new Map<string, BinanceBookTicker>();
  private readonly now: () => number;

  constructor(now: () => number = Date.now) {
    this.now = now;
  }

  update(ticker: BinanceBookTicker) {
    const previous = this.values.get(ticker.symbol);
    if (!previous || ticker.updateId >= previous.updateId) this.values.set(ticker.symbol, ticker);
  }

  get(symbol: string) {
    return this.values.get(symbol);
  }

  getStaleSymbols(maxAgeMs: number) {
    const cutoff = this.now() - maxAgeMs;
    return [...this.values.values()].filter(({ updatedAt }) => updatedAt < cutoff).map(({ symbol }) => symbol);
  }
}
