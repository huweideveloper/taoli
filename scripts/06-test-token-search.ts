import "dotenv/config";
import { OkxClient } from "../src/okx/client.js";
import { searchTokenCandidates } from "../src/okx/token-search.js";

const symbol = process.argv[2] ?? "CAKE";
const candidates = await searchTokenCandidates(new OkxClient(), symbol);
console.log(`BSC candidates for ${symbol}: ${candidates.length}`);
for (const token of candidates) {
  console.log(`\nSymbol: ${token.tokenSymbol}`);
  console.log(`Name: ${token.tokenName}`);
  console.log(`Contract: ${token.tokenContractAddress}`);
  console.log(`Decimals: ${token.decimal}`);
  console.log(`Price: ${token.price}`);
  console.log(`Liquidity: ${token.liquidity}`);
  console.log(`Market Cap: ${token.marketCap}`);
  console.log(`Holders: ${token.holders}`);
  console.log(`Recognized: ${token.communityRecognized}`);
}
