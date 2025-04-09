import type { List } from "../../../util/list.d.ts";
import type { Expression } from "../../atom.d.ts";
import type { Cache, WritableCache } from "../../cache.d.ts";
import type { Mode } from "../../mode.d.ts";
import type { RootSort } from "../../sort.d.ts";

// Closure //

export type ArrowClosure = {
  type: "arrow";
  asynchronous: boolean;
  generator: false;
};

export type FunctionClosure = {
  type: "function";
  asynchronous: boolean;
  generator: boolean;
};

export type MethodClosure = {
  type: "method";
  asynchronous: boolean;
  generator: boolean;
  proto: Cache;
};

export type ConstructorClosure = {
  type: "constructor";
  asynchronous: false;
  generator: false;
  self: Cache;
  derived: boolean;
  field: Cache;
};

export type Closure =
  | ArrowClosure
  | FunctionClosure
  | MethodClosure
  | ConstructorClosure;

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

export type RoutineCommon = {
  intermediaries: List<Intermediary>;
  result: WritableCache | null;
};

export type RootRoutine = { type: "root" } & RoutineCommon;

export type FunctionRoutine = FunctionClosure & RoutineCommon;

export type MethodRoutine = MethodClosure & RoutineCommon;

export type ConstructorRoutine = ConstructorClosure & RoutineCommon;

export type ClosureRoutine =
  | FunctionRoutine
  | MethodRoutine
  | ConstructorRoutine;

export type Routine = RootRoutine | ClosureRoutine;

export type RoutineScope = {
  root: RootSort;
  mode: Mode;
  routine: Routine;
};
