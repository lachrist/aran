import type { Cache } from "./cache.js";

export type ArrowParam = { type: "arrow" };

export type FunctionParam = { type: "function" };

export type MethodParam = { type: "method"; proto: Cache };

export type ConstructorParam = {
  type: "constructor";
  derived: boolean;
  field: Cache;
};

export type Param = ArrowParam | FunctionParam | MethodParam | ConstructorParam;
