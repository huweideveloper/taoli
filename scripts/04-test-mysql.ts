import "dotenv/config";
import { MySqlDatabase, databaseConfigFromEnv } from "../src/storage/mysql.js";

const config = databaseConfigFromEnv(process.env);
const db = new MySqlDatabase(config);
const testSymbol = "__TAOLI_STAGE4_TEST__";

try {
  await db.healthCheck();
  console.log(`MySQL connection: OK\nDatabase: ${config.database}\nSELECT 1: OK`);
  await db.runInitialMigration();
  console.log("Migration: OK");
  await db.execute(
    "INSERT INTO binance_symbols (symbol, base_asset, quote_asset, status, spot_trading_allowed) VALUES (?, ?, ?, ?, ?)",
    [testSymbol, "TEST", "USDT", "TRADING", true],
  );
  console.log("Insert test: OK");
  await db.execute("SELECT id FROM binance_symbols WHERE symbol = ?", [testSymbol]);
  console.log("Read test: OK");
  await db.execute("DELETE FROM binance_symbols WHERE symbol = ?", [testSymbol]);
  console.log("Delete test: OK");
} catch (error) {
  console.error(`MySQL check failed: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
} finally {
  await db.close();
}
