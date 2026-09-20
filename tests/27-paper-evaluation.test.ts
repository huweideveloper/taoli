import { describe, expect, it } from "vitest";
import { evaluatePaperTrades } from "../src/paper/evaluation.js";

describe("paper trading evaluation", () => {
  it("reports gross, costs, inventory constraints, and final simulated PnL", () => {
    const result = evaluatePaperTrades({
      trades: [{ id: "paper-1", symbol: "CAKEUSDT", direction: "DEX_BUY_BINANCE_SELL", status: "EXECUTED", sizeUsd: "100", gasUsd: "1", executedAt: 1, legs: [
        { venue: "BINANCE", action: "SELL", asset: "CAKE", amount: "50", quoteAmount: "105", feeUsd: "1" },
        { venue: "BSC", action: "BUY", asset: "CAKE", amount: "50", quoteAmount: "100", feeUsd: "1" },
      ] }],
      rejectedTrades: 2,
      rebalanceCostsUsd: ["2"],
    });
    expect(result.grossTheoreticalPnl.toString()).toBe("5");
    expect(result.tradingFees.toString()).toBe("2");
    expect(result.gasCosts.toString()).toBe("1");
    expect(result.rebalanceCosts.toString()).toBe("2");
    expect(result.finalSimulatedPnl.toString()).toBe("0");
    expect(result.rejectedTrades).toBe(2);
  });
});
