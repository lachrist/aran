import type { Cache } from "./cache.d.ts";

export type MethodClosure = {
  type: "method";
  proto: Cache;
};

export type ConstructorClosure = {
  type: "constructor";
  field: Cache;
  derived: boolean;
};

export type PlainClosure = {
  type: "plain";
};

export type Closure = MethodClosure | ConstructorClosure | PlainClosure;
