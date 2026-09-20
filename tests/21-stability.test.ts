import { describe, expect, it } from "vitest";
import { retry } from "../src/utils/retry.js";

describe("runtime stability helpers", () => {
  it("retries only transient errors and stops at the configured limit", async () => {
    let attempts = 0;
    const value = await retry(async () => {
      attempts += 1;
      if (attempts < 3) throw Object.assign(new Error("temporary"), { retryable: true });
      return "ok";
    }, { maxRetries: 2, delayMs: 1, shouldRetry: (error) => Boolean((error as { retryable?: boolean }).retryable) });
    expect(value).toBe("ok");
    expect(attempts).toBe(3);
  });

  it("does not retry a non-transient error", async () => {
    let attempts = 0;
    await expect(retry(async () => {
      attempts += 1;
      throw new Error("bad credentials");
    }, { maxRetries: 3, delayMs: 1, shouldRetry: () => false })).rejects.toThrow("bad credentials");
    expect(attempts).toBe(1);
  });
});
