import { BinanceClient } from "../src/binance/client.js";
import { calculateBuyVwap, calculateSellVwap } from "../src/market/vwap.js";

const symbol = process.argv[2] ?? "CAKEUSDT";
const quoteNotional = process.argv[3] ?? "3000";
const depth = await new BinanceClient().getDepth(symbol);
const bids = depth.bids.map(([price, quantity]) => ({ price, quantity }));
const asks = depth.asks.map(([price, quantity]) => ({ price, quantity }));
console.log("Buy VWAP:", calculateBuyVwap(asks, { quoteNotional }));
console.log("Sell VWAP:", calculateSellVwap(bids, { quoteNotional }));
