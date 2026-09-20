import { decimal } from "../utils/decimal.js";

export interface InventorySnapshot {
  asset: string;
  binanceAmount: string;
  bscAmount: string;
  targetBinanceAmount: string;
  targetBscAmount: string;
}

export interface RebalancePlan {
  asset: string;
  action: "WAIT_FOR_REVERSE_FLOW" | "MOVE_BINANCE_TO_BSC" | "MOVE_BSC_TO_BINANCE" | "NONE";
  amount: string;
  estimatedCostUsd: string;
}

export const planRebalance = (snapshot: InventorySnapshot, options: { strategy: "PASSIVE" | "ACTIVE"; networkCostUsd?: string; executionCostUsd?: string }): RebalancePlan => {
  if (options.strategy === "PASSIVE") return { asset: snapshot.asset, action: "WAIT_FOR_REVERSE_FLOW", amount: "0", estimatedCostUsd: "0" };
  const binanceSkew = decimal(snapshot.binanceAmount).minus(snapshot.targetBinanceAmount);
  const bscSkew = decimal(snapshot.bscAmount).minus(snapshot.targetBscAmount);
  const amount = binanceSkew.gt(0) && bscSkew.lt(0) ? binanceSkew.abs().lt(bscSkew.abs()) ? binanceSkew.abs() : bscSkew.abs() : bscSkew.gt(0) && binanceSkew.lt(0) ? bscSkew.abs().lt(binanceSkew.abs()) ? bscSkew.abs() : binanceSkew.abs() : decimal(0);
  const action = binanceSkew.gt(0) && bscSkew.lt(0) ? "MOVE_BINANCE_TO_BSC" : bscSkew.gt(0) && binanceSkew.lt(0) ? "MOVE_BSC_TO_BINANCE" : "NONE";
  const costs = decimal(options.networkCostUsd ?? "0").plus(options.executionCostUsd ?? "0");
  return { asset: snapshot.asset, action, amount: amount.toString(), estimatedCostUsd: costs.toString() };
};
