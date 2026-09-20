import "dotenv/config";
import type { RowDataPacket } from "mysql2/promise";
import { MySqlDatabase } from "../src/storage/mysql.js";
import { summarizeOpportunityMetrics } from "../src/reports/metrics.js";
import { format72HourReport } from "../src/reports/summary.js";

interface OpportunityRow extends RowDataPacket {
  netSpreadPct: string;
  durationMs: number;
  tradeSizeUsd: string;
}

const hours = Number(process.env.REPORT_HOURS ?? "72");
if (!Number.isFinite(hours) || hours <= 0) throw new Error("REPORT_HOURS must be greater than zero");
const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);
const db = new MySqlDatabase();
try {
  await db.healthCheck();
  const [opportunities] = await db.execute<OpportunityRow[]>("SELECT net_spread_pct AS netSpreadPct, duration_ms AS durationMs, trade_size_usd AS tradeSizeUsd FROM arbitrage_opportunities WHERE created_at >= ?", [cutoff]);
  const [candidateRows] = await db.execute<RowDataPacket[]>("SELECT COUNT(*) AS count FROM scanner_candidates WHERE enabled = TRUE");
  const inputs = opportunities.map(({ netSpreadPct, durationMs, tradeSizeUsd }) => ({ netSpreadPct, durationMs: Number(durationMs), sizeUsd: Number(tradeSizeUsd) }));
  const summary = summarizeOpportunityMetrics(inputs);
  const executableLooking = Object.fromEntries([100, 500, 1000, 3000].map((size) => [size, inputs.filter(({ sizeUsd, netSpreadPct, durationMs }) => sizeUsd === size && Number(netSpreadPct) > 0 && durationMs >= Number(process.env.MIN_EXECUTABLE_DURATION_MS ?? 500)).length]));
  console.log(format72HourReport({ candidates: Number(candidateRows[0]?.count ?? 0), summary, executableLooking }));
} finally {
  await db.close();
}
