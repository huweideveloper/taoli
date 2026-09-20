export const assertLiveTradingUnavailable = (): never => {
  throw new Error("Live trading is intentionally disabled in V1; use Paper Trading only.");
};
