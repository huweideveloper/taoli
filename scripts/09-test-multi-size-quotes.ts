import "dotenv/config";
import { chains } from "../config/chains.js";
import { scannerConfig } from "../config/scanner.js";
import { OkxClient } from "../src/okx/client.js";
import { quoteBothDirections } from "../src/okx/quote.js";
import { searchTokenCandidates } from "../src/okx/token-search.js";

const symbol = process.argv[2] ?? "CAKE";
const okx = new OkxClient();
const token = (await searchTokenCandidates(okx, symbol)).find(({ communityRecognized }) => communityRecognized);
if (!token) throw new Error(`No recognized BSC token candidate found for ${symbol}`);
const referencePrice = token.price;
const quotes = await quoteBothDirections(okx, {
  chainIndex: chains.bsc.chainIndex,
  tokenPriceUsd: referencePrice,
  fromTokenDecimals: chains.bsc.usdtDecimals,
  tokenDecimals: Number(token.decimal),
  usdtAddress: chains.bsc.usdtAddress,
  tokenAddress: token.tokenContractAddress,
  sizesUsd: scannerConfig.tradeSizesUsd,
});
console.log("Size\tDirection\tEffective Price\tImpact");
for (const quote of quotes) console.log(`${quote.sizeUsd}\t${quote.direction}\t${quote.effectivePrice}\t${quote.priceImpact ?? "unknown"}`);
