import { Cache } from "../../cache";

export type EvalFrame = {
  type: "closure-eval";
};

export type ArrowFrame = {
  type: "closure-arrow";
};

export type FunctionFrame = {
  type: "closure-function";
};

export type MethodFrame = {
  type: "closure-method";
  proto: Cache;
};

export type ConstructorFrame = {
  type: "closure-constructor";
  derived: boolean;
  self: Cache;
  field: Cache;
};

export type ClosureFrame =
  | EvalFrame
  | ArrowFrame
  | FunctionFrame
  | MethodFrame
  | ConstructorFrame;
