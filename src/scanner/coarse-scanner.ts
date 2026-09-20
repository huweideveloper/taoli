import { decimal } from "../utils/decimal.js";

export const shouldTriggerPreciseScan = (binanceReferencePrice: string, dexReferencePrice: string, thresholdPct: string): boolean => decimal(binanceReferencePrice).gt(0)
  && decimal(binanceReferencePrice).minus(dexReferencePrice).abs().dividedBy(binanceReferencePrice).gte(thresholdPct);
