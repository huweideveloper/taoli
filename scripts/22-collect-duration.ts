import { spawn } from "node:child_process";

const durationHours = Number(process.env.DURATION_HOURS ?? "24");
if (!Number.isFinite(durationHours) || durationHours <= 0) throw new Error("DURATION_HOURS must be greater than zero");
const scanner = spawn(process.execPath, ["--import", "tsx/esm", "scripts/14-run-scanner.ts"], { stdio: "inherit", env: process.env });
const stopAt = Date.now() + durationHours * 60 * 60 * 1000;
console.log(`Collection started for ${durationHours} hours; stop at ${new Date(stopAt).toISOString()}`);

const stop = () => {
  if (!scanner.killed) scanner.kill("SIGTERM");
};
process.once("SIGINT", stop);
process.once("SIGTERM", stop);
const timer = setTimeout(stop, durationHours * 60 * 60 * 1000);
await new Promise<void>((resolve) => scanner.once("exit", () => resolve()));
clearTimeout(timer);
