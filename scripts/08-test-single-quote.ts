import "dotenv/config";
import { chains } from "../config/chains.js";
import { OkxClient } from "../src/okx/client.js";
import { quoteExactIn } from "../src/okx/quote.js";
import { searchTokenCandidates } from "../src/okx/token-search.js";

const symbol = process.argv[2] ?? "CAKE";
const amount = process.argv[3] ?? "1000";
const okx = new OkxClient();
const candidates = await searchTokenCandidates(okx, symbol);
const token = candidates.find(({ communityRecognized }) => communityRecognized) ?? candidates[0];
if (!token) throw new Error(`No BSC token candidate found for ${symbol}`);
const quote = await quoteExactIn(okx, {
  chainIndex: chains.bsc.chainIndex,
  amount,
  fromTokenDecimals: chains.bsc.usdtDecimals,
  toTokenDecimals: Number(token.decimal),
  fromTokenAddress: chains.bsc.usdtAddress,
  toTokenAddress: token.tokenContractAddress,
});
console.log(`Input:\n${amount} USDT\n\nOutput:\n${quote.outputAmount} ${token.tokenSymbol}`);
console.log(`\nEffective Price: $${quote.effectivePrice}`);
console.log(`Price Impact: ${quote.priceImpact ?? "unknown"}`);
console.log(`Route: ${quote.route}`);
console.log(`Token Tax: ${quote.tokenTax}`);
console.log(`Quote latency: ${quote.quoteLatencyMs} ms`);
