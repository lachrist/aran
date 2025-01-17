import type { Intrinsic, SyntaxPrimitive } from "../lang/syntax";
import type { ConstantMetaVariable, WritableMetaVariable } from "./variable";

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
      primitive: SyntaxPrimitive;
    }
  | {
      type: "intrinsic";
      intrinsic: Intrinsic;
    };

export type Cache = WritableCache | ConstantCache;
