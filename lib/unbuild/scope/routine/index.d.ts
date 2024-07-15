import type { Path } from "../../../path";
import type { Cache, WritableCache } from "../../cache";

export type ProgramFrame = {
  type: "routine-program";
  sort:
    | "script"
    | "module"
    | "eval.global"
    | "eval.local.root"
    | "eval.local.deep";
  completion: { [key in Path]?: null };
  result: WritableCache | null;
};

export type ArrowFrame = {
  type: "routine-arrow";
  result: WritableCache | null;
};

export type FunctionFrame = {
  type: "routine-function";
  result: WritableCache | null;
};

export type MethodFrame = {
  type: "routine-method";
  result: WritableCache | null;
  proto: Cache;
};

export type ConstructorFrame = {
  type: "routine-constructor";
  result: WritableCache | null;
  derived: boolean;
  self: Cache;
  field: Cache;
};

export type RoutineFrame =
  | ProgramFrame
  | ArrowFrame
  | FunctionFrame
  | MethodFrame
  | ConstructorFrame;
