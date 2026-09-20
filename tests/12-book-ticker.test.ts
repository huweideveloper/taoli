import { describe, expect, it } from "vitest";
import { parseBookTicker } from "../src/binance/book-ticker.js";
import { BookTickerStore } from "../src/market/ticker-store.js";

describe("Binance book ticker", () => {
  it("parses both raw and combined stream messages into the in-memory store", () => {
    const store = new BookTickerStore();
    store.update(parseBookTicker(JSON.stringify({ e: "bookTicker", u: 1, s: "CAKEUSDT", b: "2.1", B: "10", a: "2.2", A: "8" })));
    store.update(parseBookTicker(JSON.stringify({ stream: "cakeusdt@bookTicker", data: { e: "bookTicker", u: 2, s: "CAKEUSDT", b: "2.0", B: "11", a: "2.1", A: "9" } })));
    expect(store.get("CAKEUSDT")).toMatchObject({ bidPrice: "2.0", askPrice: "2.1", updateId: 2 });
  });

  it("identifies stale tickers by timestamp", () => {
    const store = new BookTickerStore(() => 10_000);
    store.update({ symbol: "CAKEUSDT", bidPrice: "2", bidQty: "1", askPrice: "2.1", askQty: "1", updateId: 1, updatedAt: 9_000 });
    expect(store.getStaleSymbols(500)).toEqual(["CAKEUSDT"]);
  });
});
