import "dotenv/config";
import { BinanceClient } from "../src/binance/client.js";
import { discoverUsdtSpotSymbols } from "../src/tokens/discovery.js";
import { buildTokenRegistry } from "../src/tokens/registry.js";
import { OkxClient } from "../src/okx/client.js";
import { searchTokenCandidates } from "../src/okx/token-search.js";
import { MySqlDatabase } from "../src/storage/mysql.js";
import { saveTokenRegistryEntry } from "../src/storage/repositories/token-registry.js";

const symbols = discoverUsdtSpotSymbols(await new BinanceClient().getExchangeInfo());
const okx = new OkxClient();
const candidates = new Map<string, Awaited<ReturnType<typeof searchTokenCandidates>>>();
for (const symbol of symbols) candidates.set(symbol.baseAsset, await searchTokenCandidates(okx, symbol.baseAsset));

const registry = buildTokenRegistry(symbols, (asset) => candidates.get(asset) ?? []);
const db = new MySqlDatabase();
try {
  await db.healthCheck();
  await db.runInitialMigration();
  for (const entry of registry) await saveTokenRegistryEntry(db, entry);
} finally {
  await db.close();
}

const counts = registry.reduce<Record<string, number>>((result, { status }) => {
  result[status] = (result[status] ?? 0) + 1;
  return result;
}, {});
console.log(`Binance USDT Spot: ${symbols.length}`);
for (const status of ["VERIFIED", "REVIEW", "CONFLICT", "NOT_FOUND", "REJECTED"] as const) console.log(`${status}: ${counts[status] ?? 0}`);
console.log("Registry build completed.");
