import WebSocket from "ws";
import { z } from "zod";
import { logger } from "../utils/logger.js";
import { BookTickerStore } from "../market/ticker-store.js";

export interface BinanceBookTicker {
  symbol: string;
  bidPrice: string;
  bidQty: string;
  askPrice: string;
  askQty: string;
  updateId: number;
  updatedAt: number;
}

const eventSchema = z.object({ e: z.literal("bookTicker"), u: z.number(), s: z.string(), b: z.string(), B: z.string(), a: z.string(), A: z.string() });

export const parseBookTicker = (input: string | unknown): BinanceBookTicker => {
  const parsed = typeof input === "string" ? JSON.parse(input) as unknown : input;
  const event = eventSchema.parse((parsed && typeof parsed === "object" && "data" in parsed) ? parsed.data : parsed);
  return { symbol: event.s, bidPrice: event.b, bidQty: event.B, askPrice: event.a, askQty: event.A, updateId: event.u, updatedAt: Date.now() };
};

export interface BinanceBookTickerStreamOptions {
  url?: string;
  reconnectBaseMs?: number;
  reconnectMaxMs?: number;
  heartbeatMs?: number;
}

export class BinanceBookTickerStream {
  private socket?: WebSocket;
  private reconnectTimer?: ReturnType<typeof setTimeout>;
  private heartbeatTimer?: ReturnType<typeof setInterval>;
  private running = false;
  private reconnectAttempt = 0;

  constructor(
    private readonly symbols: string[],
    readonly store: BookTickerStore,
    private readonly options: BinanceBookTickerStreamOptions = {},
  ) {}

  start() {
    if (this.running) return;
    if (this.symbols.length === 0) throw new Error("At least one Binance symbol is required");
    this.running = true;
    this.connect();
  }

  stop() {
    this.running = false;
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    if (this.heartbeatTimer) clearInterval(this.heartbeatTimer);
    this.socket?.close();
    this.socket = undefined;
  }

  private connect() {
    const streams = this.symbols.map((symbol) => `${symbol.toLowerCase()}@bookTicker`).join("/");
    const url = this.options.url ?? `wss://stream.binance.com:9443/stream?streams=${streams}`;
    const socket = new WebSocket(url);
    this.socket = socket;
    socket.on("open", () => {
      this.reconnectAttempt = 0;
      logger.info({ event: "binance_ws_connected", symbols: this.symbols.length });
      this.heartbeatTimer = setInterval(() => {
        if (socket.readyState === WebSocket.OPEN) socket.ping();
      }, this.options.heartbeatMs ?? 20_000);
    });
    socket.on("message", (data) => {
      try {
        this.store.update(parseBookTicker(data.toString()));
      } catch (error) {
        logger.warn({ event: "binance_ws_parse_error", error: error instanceof Error ? error.message : String(error) });
      }
    });
    socket.on("error", (error) => logger.error({ event: "binance_ws_error", error: error.message }));
    socket.on("close", () => {
      if (this.heartbeatTimer) clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = undefined;
      if (!this.running) return;
      const delayMs = Math.min((this.options.reconnectBaseMs ?? 250) * 2 ** this.reconnectAttempt, this.options.reconnectMaxMs ?? 30_000);
      this.reconnectAttempt += 1;
      logger.warn({ event: "binance_ws_reconnect", delayMs, reconnectAttempt: this.reconnectAttempt });
      this.reconnectTimer = setTimeout(() => this.connect(), delayMs);
    });
  }
}
