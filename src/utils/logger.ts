import pino from "pino";

export const logger = pino({
  level: process.env.LOG_LEVEL ?? "info",
  redact: ["*.apiKey", "*.api_key", "*.secret", "*.secretKey", "*.secret_key", "*.passphrase", "*.signature", "secret", "secretKey", "secret_key", "passphrase", "signature"],
});
