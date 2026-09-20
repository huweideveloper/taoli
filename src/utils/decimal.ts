import { Decimal } from "decimal.js";

export { Decimal };

export type DecimalValue = Decimal.Value;

export const decimal = (value: DecimalValue) => new Decimal(value);
export const one = () => new Decimal(1);
