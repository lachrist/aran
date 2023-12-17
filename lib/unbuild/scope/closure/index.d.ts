import { Cache } from "../../cache";

export type BlockFrame = {
  type: "closure-block";
  kind:
    | "eval"
    | "try"
    | "catch"
    | "finally"
    | "then"
    | "else"
    | "while"
    | "naked";
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
  | BlockFrame
  | ArrowFrame
  | FunctionFrame
  | MethodFrame
  | ConstructorFrame;
