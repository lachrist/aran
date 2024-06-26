import { ConstantMetaVariable, WritableMetaVariable } from "./variable";

export type WritableCache = {
  type: "writable";
  variable: WritableMetaVariable;
};

export type ConstantCache =
  | {
      type: "constant";
      variable: ConstantMetaVariable;
    }
  | {
      type: "primitive";
      primitive: aran.Primitive;
    }
  | {
      type: "intrinsic";
      intrinsic: aran.Intrinsic;
    };

export type Cache = WritableCache | ConstantCache;
