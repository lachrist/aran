import type { Path } from "../../../path";
import type { Cache, WritableCache } from "../../cache";

export type ProgramFrame = {
  type: "routine";
  kind: "program";
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
  type: "routine";
  kind: "arrow";
  result: WritableCache | null;
};

export type FunctionFrame = {
  type: "routine";
  kind: "function";
  result: WritableCache | null;
};

export type MethodFrame = {
  type: "routine";
  kind: "method";
  result: WritableCache | null;
  proto: Cache;
};

export type ConstructorFrame = {
  type: "routine";
  kind: "constructor";
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
