import axios, { type AxiosInstance } from "axios";
import { z } from "zod";
import { logger } from "../utils/logger.js";
import { createOkxHeaders, okxCredentialsFromEnv, type OkxCredentials } from "./auth.js";

export interface OkxClientOptions {
  baseUrl?: string;
  credentials?: OkxCredentials;
  timeoutMs?: number;
  maxRetries?: number;
  retryDelayMs?: number;
}

export class OkxApiError extends Error {
  constructor(message: string, readonly status?: number, readonly code?: string) {
    super(message);
    this.name = "OkxApiError";
  }
}

const envelopeSchema = z.object({ code: z.string(), msg: z.string(), data: z.unknown() });
const isRetryable = (status?: number) => status === undefined || status === 429 || status >= 500;

export class OkxClient {
  private readonly http: AxiosInstance;
  private readonly credentials: OkxCredentials;
  private readonly maxRetries: number;
  private readonly retryDelayMs: number;

  constructor(options: OkxClientOptions = {}) {
    this.http = axios.create({
      baseURL: options.baseUrl ?? process.env.OKX_BASE_URL ?? "https://web3.okx.com",
      timeout: options.timeoutMs ?? Number(process.env.OKX_TIMEOUT_MS ?? 5_000),
    });
    this.credentials = options.credentials ?? okxCredentialsFromEnv(process.env);
    this.maxRetries = options.maxRetries ?? 2;
    this.retryDelayMs = options.retryDelayMs ?? 250;
  }

  async get<T>(requestPath: string, params: Record<string, string | number> = {}): Promise<T> {
    const query = new URLSearchParams(Object.entries(params).map(([key, value]) => [key, String(value)])).toString();
    const requestPathWithQuery = query ? `${requestPath}?${query}` : requestPath;
    for (let attempt = 0; ; attempt += 1) {
      const timestamp = new Date().toISOString();
      try {
        const response = await this.http.get(requestPathWithQuery, {
          headers: createOkxHeaders({ credentials: this.credentials, timestamp, method: "GET", requestPath: requestPathWithQuery }),
        });
        const envelope = envelopeSchema.parse(response.data);
        if (envelope.code !== "0") throw new OkxApiError(envelope.msg || "OKX API error", response.status, envelope.code);
        return envelope.data as T;
      } catch (error) {
        const status = axios.isAxiosError(error) ? error.response?.status : error instanceof OkxApiError ? error.status : undefined;
        const code = error instanceof OkxApiError ? error.code : undefined;
        if (attempt >= this.maxRetries || !isRetryable(status)) {
          const message = error instanceof Error ? error.message : "unknown OKX request error";
          logger.error({ event: "okx_request_failed", requestPath, status, errorCode: code, attempt }, message);
          throw error instanceof OkxApiError ? error : new OkxApiError(message, status, code);
        }
        const delayMs = this.retryDelayMs * 2 ** attempt;
        logger.warn({ event: "okx_request_retry", requestPath, status, attempt: attempt + 1, delayMs });
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }
  }
}
