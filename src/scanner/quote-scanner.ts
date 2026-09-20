import { logger } from "../utils/logger.js";

export interface PreciseQuote<T> {
  key: string;
  observedAt: number;
  value: T;
}

export interface PreciseQuoteScannerOptions {
  concurrency?: number;
  cacheTtlMs?: number;
  cooldownMs?: number;
  staleMs?: number;
  minIntervalMs?: number;
  now?: () => number;
}

interface QueueItem<T> {
  key: string;
  resolve: (value: PreciseQuote<T> | undefined) => void;
  reject: (error: unknown) => void;
}

export class PreciseQuoteScanner<T> {
  private readonly queue: QueueItem<T>[] = [];
  private readonly pending = new Map<string, Promise<PreciseQuote<T> | undefined>>();
  private readonly cache = new Map<string, { quote: PreciseQuote<T>; cachedAt: number }>();
  private readonly lastRequested = new Map<string, number>();
  private active = 0;
  private lastStartedAt = 0;
  private pumpTimer?: ReturnType<typeof setTimeout>;
  private readonly options: Required<PreciseQuoteScannerOptions>;

  constructor(private readonly fetchQuote: (key: string) => Promise<PreciseQuote<T>>, options: PreciseQuoteScannerOptions = {}) {
    this.options = {
      concurrency: options.concurrency ?? 4,
      cacheTtlMs: options.cacheTtlMs ?? 1_000,
      cooldownMs: options.cooldownMs ?? 250,
      staleMs: options.staleMs ?? 2_000,
      minIntervalMs: options.minIntervalMs ?? 0,
      now: options.now ?? Date.now,
    };
    if (this.options.concurrency < 1) throw new Error("concurrency must be positive");
  }

  request(key: string): Promise<PreciseQuote<T> | undefined> {
    const now = this.options.now();
    const cached = this.cache.get(key);
    if (cached && now - cached.cachedAt <= this.options.cacheTtlMs && now - cached.quote.observedAt <= this.options.staleMs) return Promise.resolve(cached.quote);
    const pending = this.pending.get(key);
    if (pending) return pending;
    const lastRequested = this.lastRequested.get(key);
    if (lastRequested !== undefined && now - lastRequested < this.options.cooldownMs) return Promise.resolve(undefined);
    const promise = new Promise<PreciseQuote<T> | undefined>((resolve, reject) => this.queue.push({ key, resolve, reject }));
    this.pending.set(key, promise);
    this.pump();
    return promise;
  }

  private pump() {
    if (this.pumpTimer || this.active >= this.options.concurrency || this.queue.length === 0) return;
    const waitMs = Math.max(0, this.options.minIntervalMs - (this.options.now() - this.lastStartedAt));
    if (waitMs > 0) {
      this.pumpTimer = setTimeout(() => {
        this.pumpTimer = undefined;
        this.pump();
      }, waitMs);
      return;
    }
    const item = this.queue.shift();
    if (!item) return;
    this.active += 1;
    this.lastStartedAt = this.options.now();
    this.lastRequested.set(item.key, this.lastStartedAt);
    void this.fetchQuote(item.key).then((quote) => {
      const age = this.options.now() - quote.observedAt;
      if (age > this.options.staleMs) {
        item.resolve(undefined);
        return;
      }
      this.cache.set(item.key, { quote, cachedAt: this.options.now() });
      item.resolve(quote);
    }).catch((error: unknown) => {
      logger.warn({ event: "precise_quote_failed", key: item.key, error: error instanceof Error ? error.message : String(error) });
      item.reject(error);
    }).finally(() => {
      this.active -= 1;
      this.pending.delete(item.key);
      this.pump();
    });
    this.pump();
  }
}
