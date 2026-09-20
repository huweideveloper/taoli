import "dotenv/config";
import assert from "node:assert/strict";
import { scannerConfig } from "../config/scanner.js";
import { decimal } from "../src/utils/decimal.js";
import { logger } from "../src/utils/logger.js";

const major = Number(process.versions.node.split(".")[0]);
assert.ok(major >= 22, `Node 22+ required, found ${process.versions.node}`);
assert.ok(scannerConfig.tradeSizesUsd.length > 0);
assert.equal(decimal("0.1").plus("0.2").toString(), "0.3");
logger.debug({ event: "environment_check" });

console.log("Environment check");
console.log(`Node: v${process.versions.node}`);
console.log("Config: OK");
console.log("Logger: OK");
console.log("Decimal: OK");
console.log("System ready");
