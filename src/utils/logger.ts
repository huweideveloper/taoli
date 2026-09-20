import pino from "pino";

export const logger = pino({
  level: process.env.LOG_LEVEL ?? "info",
  redact: ["*.secret", "*.secretKey", "*.passphrase", "*.signature", "secret", "secretKey", "passphrase", "signature"],
});
