import type { Cache, WritableCache } from "../../cache";

export type EvalFrame = {
  type: "routine-eval";
};

export type ArrowFrame = {
  type: "routine-arrow";
};

export type FunctionFrame = {
  type: "routine-function";
};

export type MethodFrame = {
  type: "routine-method";
  proto: Cache;
};

export type ConstructorFrame = {
  type: "routine-constructor";
  derived: boolean;
  self: Cache;
  field: Cache;
  delay_return: null | WritableCache;
};

export type RoutineFrame =
  | EvalFrame
  | ArrowFrame
  | FunctionFrame
  | MethodFrame
  | ConstructorFrame;
