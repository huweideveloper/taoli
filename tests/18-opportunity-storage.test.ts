import { describe, expect, it } from "vitest";
import { loadOpportunityMigration } from "../src/storage/mysql.js";

describe("opportunity storage", () => {
  it("contains the high-frequency opportunity and snapshot schema", async () => {
    const migration = await loadOpportunityMigration();
    expect(migration).toContain("CREATE TABLE IF NOT EXISTS arbitrage_opportunities");
    expect(migration).toContain("net_profit_usd");
    expect(migration).toContain("CREATE TABLE IF NOT EXISTS opportunity_snapshots");
    expect(migration).toContain("idx_opportunities_net_spread");
  });
});
