import type { Expression } from "../../atom";
import type { Cache, WritableCache } from "../../cache";
import type { Mode } from "../../mode";
import type { RootSort } from "../../sort";

// Operation //

export type ReadThisOperation = {
  type: "read-this";
};

export type ReadNewTargetOperation = {
  type: "read-new-target";
};

export type ReadInputOperation = {
  type: "read-input";
};

export type GetSuperOperation = {
  type: "get-super";
  key: Expression;
};

export type SetSuperOperation = {
  type: "set-super";
  key: Expression;
  value: Expression;
};

export type CallSuperOperation = {
  type: "call-super";
  input: Expression;
};

export type UpdateResultOperation = {
  type: "update-result";
  result: Expression | null;
};

export type ReadResultOperation = {
  type: "read-result";
};

export type FinalizeResultOperation = {
  type: "finalize-result";
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
