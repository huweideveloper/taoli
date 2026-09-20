import axios, { type AxiosInstance } from "axios";
import { logger } from "../utils/logger.js";
import { parseExchangeInfo } from "./exchange-info.js";
import type { BinanceExchangeInfo } from "./types.js";

export interface BinanceClientOptions {
  baseUrl?: string;
  timeoutMs?: number;
  maxRetries?: number;
  retryDelayMs?: number;
}

export class BinanceApiError extends Error {
  constructor(message: string, readonly status?: number, readonly code?: number | string) {
    super(message);
    this.name = "BinanceApiError";
  }
}

const isRetryable = (status?: number) => status === undefined || status === 429 || status >= 500;

export class BinanceClient {
  private readonly http: AxiosInstance;
  private readonly maxRetries: number;
  private readonly retryDelayMs: number;

  constructor(options: BinanceClientOptions = {}) {
    this.http = axios.create({
      baseURL: options.baseUrl ?? process.env.BINANCE_REST_BASE_URL ?? "https://api.binance.com",
      timeout: options.timeoutMs ?? Number(process.env.BINANCE_TIMEOUT_MS ?? 5_000),
    });
    this.maxRetries = options.maxRetries ?? 2;
    this.retryDelayMs = options.retryDelayMs ?? 250;
  }

  async getExchangeInfo(): Promise<BinanceExchangeInfo> {
    const payload = await this.get<unknown>("/api/v3/exchangeInfo");
    return parseExchangeInfo(payload);
  }

  private async get<T>(path: string): Promise<T> {
    for (let attempt = 0; ; attempt += 1) {
      try {
        const response = await this.http.get<T>(path);
        return response.data;
      } catch (error) {
        const status = axios.isAxiosError(error) ? error.response?.status : undefined;
        const apiPayload = axios.isAxiosError(error) && error.response?.data && typeof error.response.data === "object"
          ? error.response.data as { code?: number | string; msg?: string }
          : undefined;
        if (attempt >= this.maxRetries || !isRetryable(status)) {
          const message = apiPayload?.msg ?? (error instanceof Error ? error.message : "unknown Binance request error");
          logger.error({ event: "binance_request_failed", path, status, code: apiPayload?.code, attempt }, message);
          throw new BinanceApiError(message, status, apiPayload?.code);
        }
        const delayMs = this.retryDelayMs * 2 ** attempt;
        logger.warn({ event: "binance_request_retry", path, status, attempt: attempt + 1, delayMs });
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }
  }
}
