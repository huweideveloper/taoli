import { BinanceClient } from "../src/binance/client.js";

const info = await new BinanceClient().getExchangeInfo();
const btc = info.symbols.find(({ symbol }) => symbol === "BTCUSDT");

console.log("Binance connected");
console.log(`\nTotal symbols: ${info.symbols.length}`);
if (btc) {
  console.log(`\n${btc.symbol}`);
  console.log(`baseAsset: ${btc.baseAsset}`);
  console.log(`quoteAsset: ${btc.quoteAsset}`);
  console.log(`status: ${btc.status}`);
}
