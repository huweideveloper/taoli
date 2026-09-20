import { describe, expect, it } from "vitest";
import { planRebalance } from "../src/paper/rebalance.js";

describe("inventory and rebalancing", () => {
  it("keeps passive rebalancing as a no-op research baseline", () => {
    const plan = planRebalance({ asset: "CAKE", binanceAmount: "450", bscAmount: "150", targetBinanceAmount: "300", targetBscAmount: "300" }, { strategy: "PASSIVE" });
    expect(plan.action).toBe("WAIT_FOR_REVERSE_FLOW");
    expect(plan.estimatedCostUsd).toBe("0");
  });

  it("plans active movement from the surplus venue and includes costs", () => {
    const plan = planRebalance({ asset: "CAKE", binanceAmount: "450", bscAmount: "150", targetBinanceAmount: "300", targetBscAmount: "300" }, { strategy: "ACTIVE", networkCostUsd: "2", executionCostUsd: "1" });
    expect(plan.action).toBe("MOVE_BINANCE_TO_BSC");
    expect(plan.amount).toBe("150");
    expect(plan.estimatedCostUsd).toBe("3");
  });
});
