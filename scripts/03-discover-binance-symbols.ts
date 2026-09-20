import { BinanceClient } from "../src/binance/client.js";
import { discoverUsdtSpotSymbols } from "../src/tokens/discovery.js";

const info = await new BinanceClient().getExchangeInfo();
const symbols = discoverUsdtSpotSymbols(info);

console.log(`Total Binance symbols: ${info.symbols.length}`);
console.log(`USDT Spot trading pairs: ${symbols.length}\n`);
for (const symbol of symbols.slice(0, 20)) console.log(symbol.symbol);
console.log("\nDiscovery completed.");
