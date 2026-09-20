import { Decimal } from "decimal.js";

export { Decimal };

export type DecimalValue = Decimal.Value;

export const decimal = (value: DecimalValue) => new Decimal(value);
export const one = () => new Decimal(1);

export const toBaseUnits = (amount: string, decimals: number): string => {
  if (!Number.isInteger(decimals) || decimals < 0) throw new Error("decimals must be a non-negative integer");
  const scaled = decimal(amount).times(decimal(10).pow(decimals));
  if (scaled.isNegative() || !scaled.isInteger()) throw new Error("amount has more precision than token decimals");
  return scaled.toFixed(0);
};

export const fromBaseUnits = (amount: string, decimals: number): string => {
  if (!/^\d+$/.test(amount)) throw new Error("base units must be a non-negative integer string");
  if (!Number.isInteger(decimals) || decimals < 0) throw new Error("decimals must be a non-negative integer");
  return decimal(amount).dividedBy(decimal(10).pow(decimals)).toFixed();
};
