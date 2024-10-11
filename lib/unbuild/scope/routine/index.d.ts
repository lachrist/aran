import type { Expression } from "../../atom";
import type { Cache, WritableCache } from "../../cache";
import type { Mode } from "../../mode";
import type { RootSort } from "../../sort";

// Operation //

export type ReadThisOperation = {};

export type ReadNewTargetOperation = {};

export type ReadInputOperation = {};

export type GetSuperOperation = {
  key: Expression;
};

export type SetSuperOperation = {
  key: Expression;
  value: Expression;
};

export type CallSuperOperation = {
  input: Expression;
};

export type UpdateResultOperation = {
  result: Expression | null;
};

export type ReadResultOperation = {};

export type FinalizeResultOperation = {
  result: Expression | null;
};

// Scope //

export type Intermediary = "none" | "eval.local.deep" | "arrow";

export type RootRoutine = {
  type: "root";
  intermediary: Intermediary;
  result: WritableCache | null;
};

export type FunctionRoutine = {
  type: "function";
  intermediary: Intermediary;
  result: WritableCache | null;
};

export type MethodRoutine = {
  type: "method";
  intermediary: Intermediary;
  result: WritableCache | null;
  proto: Cache;
};

export type ConstructorRoutine = {
  type: "constructor";
  intermediary: Intermediary;
  result: WritableCache | null;
  derived: boolean;
  self: Cache;
  field: Cache;
};

export type Routine =
  | RootRoutine
  | FunctionRoutine
  | MethodRoutine
  | ConstructorRoutine;

export type RoutineScope = {
  root: RootSort;
  mode: Mode;
  routine: Routine;
};
