import { decimal } from "../utils/decimal.js";

export interface OrderBookLevel {
  price: string;
  quantity: string;
}

export interface VwapRequest {
  baseQuantity?: string;
  quoteNotional?: string;
}

export interface VwapResult {
  vwap: string | null;
  filledQuantity: string;
  quoteAmount: string;
  levelsConsumed: number;
  insufficientDepth: boolean;
}

const format = (value: ReturnType<typeof decimal>) => {
  const fixed = value.toFixed(11);
  return fixed.includes(".") ? fixed.replace(/0+$/, "").replace(/\.$/, "") : fixed;
};

const calculate = (levels: OrderBookLevel[], request: VwapRequest, side: "buy" | "sell"): VwapResult => {
  if ((request.baseQuantity === undefined) === (request.quoteNotional === undefined)) throw new Error("provide exactly one baseQuantity or quoteNotional");
  let remaining = decimal(request.baseQuantity ?? request.quoteNotional ?? "0");
  if (remaining.isNegative()) throw new Error("requested amount must be non-negative");
  let filled = decimal(0);
  let quote = decimal(0);
  let levelsConsumed = 0;
  for (const level of levels) {
    if (remaining.isZero()) break;
    const price = decimal(level.price);
    const available = decimal(level.quantity);
    const capacity = request.baseQuantity !== undefined ? available : available.times(price);
    const consumesAll = remaining.lte(capacity);
    const taken = consumesAll ? remaining : capacity;
    const base = request.baseQuantity !== undefined ? taken : taken.dividedBy(price);
    const notional = base.times(price);
    filled = filled.plus(base);
    quote = quote.plus(notional);
    remaining = consumesAll ? decimal(0) : remaining.minus(request.baseQuantity !== undefined ? base : notional);
    levelsConsumed += 1;
  }
  return {
    vwap: filled.isZero() ? null : format(quote.dividedBy(filled)),
    filledQuantity: format(filled),
    quoteAmount: format(quote),
    levelsConsumed,
    insufficientDepth: !remaining.isZero(),
  };
};

export const calculateBuyVwap = (asks: OrderBookLevel[], request: VwapRequest) => calculate(asks, request, "buy");
export const calculateSellVwap = (bids: OrderBookLevel[], request: VwapRequest) => calculate(bids, request, "sell");
