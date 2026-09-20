import { describe, expect, it } from "vitest";
import { databaseConfigFromEnv, loadInitialMigration } from "../src/storage/mysql.js";

describe("MySQL foundation", () => {
  it("uses safe local defaults and exposes the versioned initial migration", async () => {
    const config = databaseConfigFromEnv({});
    expect(config).toMatchObject({ host: "127.0.0.1", port: 3306, database: "cex_dex_arbitrage", user: "root" });
    const migration = await loadInitialMigration();
    expect(migration).toContain("CREATE TABLE IF NOT EXISTS binance_symbols");
    expect(migration).toContain("CREATE TABLE IF NOT EXISTS scanner_candidates");
  });
});
