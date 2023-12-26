import type { Cache } from "../cache.d.ts";

export type ArrowParamn = { type: "arrow" };

export type FunctionParam = { type: "function" };

export type MethodParam = { type: "method"; proto: Cache };

export type ConstructorParam = {
  type: "constructor";
  derived: boolean;
  field: Cache;
};

export type ClosureParam =
  | ArrowParamn
  | FunctionParam
  | MethodParam
  | ConstructorParam;
