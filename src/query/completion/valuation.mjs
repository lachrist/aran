import { assert, returnx } from "../../util/index.mjs";

export const UNVALUED = false;

export const VALUED = true;

export const labelizeValuation = (valuation) => {
  assert(typeof valuation !== "boolean", "expected a label valuation");
  return valuation;
};

export const valuateLabel = returnx;
