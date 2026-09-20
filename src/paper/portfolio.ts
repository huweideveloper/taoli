import { decimal, Decimal } from "../utils/decimal.js";

export type PaperVenue = "BINANCE" | "BSC";

export class PaperPortfolio {
  private readonly balances = new Map<PaperVenue, Map<string, Decimal>>();

  constructor(initial: Record<PaperVenue, Record<string, Decimal.Value>>) {
    for (const venue of ["BINANCE", "BSC"] as const) {
      const values = new Map<string, Decimal>();
      for (const [asset, amount] of Object.entries(initial[venue] ?? {})) values.set(asset, decimal(amount));
      this.balances.set(venue, values);
    }
  }

  balance(venue: PaperVenue, asset: string) {
    return this.balances.get(venue)?.get(asset) ?? decimal(0);
  }

  credit(venue: PaperVenue, asset: string, amount: Decimal.Value) {
    const value = decimal(amount);
    if (value.isNegative()) throw new Error("credit amount must be non-negative");
    this.setBalance(venue, asset, this.balance(venue, asset).plus(value));
  }

  debit(venue: PaperVenue, asset: string, amount: Decimal.Value) {
    const value = decimal(amount);
    if (value.isNegative()) throw new Error("debit amount must be non-negative");
    const current = this.balance(venue, asset);
    if (current.lt(value)) throw new Error(`insufficient ${venue} ${asset} balance`);
    this.setBalance(venue, asset, current.minus(value));
  }

  snapshot() {
    return Object.fromEntries([...this.balances].map(([venue, values]) => [venue, Object.fromEntries([...values].map(([asset, amount]) => [asset, amount.toString()]))]));
  }

  private setBalance(venue: PaperVenue, asset: string, amount: Decimal) {
    this.balances.get(venue)?.set(asset, amount);
  }
}
