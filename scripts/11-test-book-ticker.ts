import { BookTickerStore } from "../src/market/ticker-store.js";
import { BinanceBookTickerStream } from "../src/binance/book-ticker.js";

const symbols = (process.argv.slice(2).length ? process.argv.slice(2) : ["BTCUSDT"]).map((symbol) => symbol.toUpperCase());
const store = new BookTickerStore();
const stream = new BinanceBookTickerStream(symbols, store);
stream.start();
const interval = setInterval(() => {
  for (const symbol of symbols) console.log(symbol, store.get(symbol) ?? "waiting");
}, 5_000);
setTimeout(() => {
  clearInterval(interval);
  stream.stop();
  console.log("Book ticker test completed.");
}, 30_000).unref();
