export interface ReportSummary {
  raw: number;
  above03Pct: number;
  above05Pct: number;
  above1Pct: number;
  durationP50Ms: number | null;
  durationP90Ms: number | null;
  durationP99Ms: number | null;
  capacity: Record<number, number>;
}

export const format72HourReport = (input: { candidates: number; summary: ReportSummary; executableLooking: Record<number, number> }) => {
  const lines = [
    "72 Hour Arbitrage Research Report",
    "",
    `Candidates monitored: ${input.candidates}`,
    "",
    "Observed",
    `Raw: ${input.summary.raw}`,
    `Net > 0.3%: ${input.summary.above03Pct}`,
    `Net > 0.5%: ${input.summary.above05Pct}`,
    `Net > 1.0%: ${input.summary.above1Pct}`,
    "",
    "Duration",
    `P50: ${input.summary.durationP50Ms ?? "n/a"}ms`,
    `P90: ${input.summary.durationP90Ms ?? "n/a"}ms`,
    `P99: ${input.summary.durationP99Ms ?? "n/a"}ms`,
    "",
    "Observed capacity by size",
  ];
  for (const size of [100, 500, 1000, 3000]) lines.push(`$${size}: ${input.summary.capacity[size] ?? 0}`);
  lines.push("", "Actually Executable-looking (not verified by real fills)");
  for (const size of [100, 500, 1000, 3000]) lines.push(`$${size}: ${input.executableLooking[size] ?? 0}`);
  return lines.join("\n");
};
