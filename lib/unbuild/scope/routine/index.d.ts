import type { List } from "../../../util/list";
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
  origin: "program" | "closure";
  result: Expression | null;
};

export type ReadResultOperation = {};

export type FinalizeResultOperation = {
  result: Expression | null;
};

// Scope //

export type Intermediary = "eval.local.deep" | "arrow" | "static-block";

export type RootRoutine = {
  type: "root";
  intermediaries: List<Intermediary>;
  result: WritableCache | null;
};

export type FunctionRoutine = {
  type: "function";
  intermediaries: List<Intermediary>;
  result: WritableCache | null;
};

export type MethodRoutine = {
  type: "method";
  intermediaries: List<Intermediary>;
  result: WritableCache | null;
  proto: Cache;
};

export type ConstructorRoutine = {
  type: "constructor";
  intermediaries: List<Intermediary>;
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
