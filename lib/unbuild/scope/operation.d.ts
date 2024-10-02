import type { PrivateKeyName, VariableName } from "estree-sentry";
import type { Hash } from "../../hash";
import type { Sequence } from "../../sequence";
import type { Effect, Expression } from "../atom";
import type { Meta } from "../meta";
import type { BodyPrelude } from "../prelude";
import type { ConstantMetaVariable } from "../variable";

export { RootFrame } from "./root";

export type Mode = "strict" | "sloppy";

// Variable //

export type LateDeclareOperation = {
  type: "late-declare";
  mode: "sloppy";
  variable: VariableName;
  write: "perform";
  conflict: "report" | "ignore";
};

export type InitializeOperation = {
  type: "initialize";
  mode: Mode;
  variable: VariableName;
  right: Expression | null;
};

export type WriteOperation = {
  type: "write";
  mode: Mode;
  variable: VariableName;
  right: Expression;
};

export type WriteSloppyFunctionOperation = {
  type: "write-sloppy-function";
  mode: "sloppy";
  variable: VariableName;
  right: null | ConstantMetaVariable;
};

export type ReadOperation = {
  type: "read";
  mode: Mode;
  variable: VariableName;
};

export type TypeofOperation = {
  type: "typeof";
  mode: Mode;
  variable: VariableName;
};

export type DiscardOperation = {
  type: "discard";
  mode: Mode;
  variable: VariableName;
};

export type ReadAmbientThisOperation = {
  type: "read-ambient-this";
  mode: Mode;
  variable: VariableName;
};

export type VariableLoadOperation =
  | ReadOperation
  | TypeofOperation
  | DiscardOperation
  | ReadAmbientThisOperation;

export type VariableSaveOperation =
  | InitializeOperation
  | WriteOperation
  | LateDeclareOperation
  | WriteSloppyFunctionOperation;

export type VariableOperation = VariableLoadOperation | VariableSaveOperation;

// Root //

export type ReadImportOperation = {
  type: "read-import";
  mode: Mode;
};

export type ReadImportMetaOperation = {
  type: "read-import-meta";
  mode: Mode;
};

// Catch //

export type ReadErrorOperation = {
  type: "read-error";
  mode: Mode;
};

export type CatchLoadOperation = ReadErrorOperation;

// Routine //

export type ReadThisOperation = {
  type: "read-this";
  mode: Mode;
};

export type ReadNewTargetOperation = {
  type: "read-new-target";
  mode: Mode;
};

export type ReadInputOperation = {
  type: "read-input";
  mode: Mode;
};

export type GetSuperOperation = {
  type: "get-super";
  mode: Mode;
  key: Expression;
};

export type SetSuperOperation = {
  type: "set-super";
  mode: Mode;
  key: Expression;
  value: Expression;
};

export type CallSuperOperation = {
  type: "call-super";
  mode: Mode;
  input: Expression;
};

export type UpdateResultOperation = {
  type: "update-result";
  mode: Mode;
  result: Expression | null;
};

export type BackupResultOperation = {
  type: "backup-result";
  mode: Mode;
};

export type FinalizeResultOperation = {
  type: "finalize-result";
  mode: Mode;
  result: Expression | null;
};

export type RoutineLoadOperation =
  | ReadThisOperation
  | ReadNewTargetOperation
  | ReadInputOperation
  | GetSuperOperation
  | FinalizeResultOperation
  | BackupResultOperation;

export type RoutineSaveOperation =
  | SetSuperOperation
  | CallSuperOperation
  | UpdateResultOperation;

// Private //

export type DefinePrivateOperation = {
  type: "define-private";
  mode: Mode;
  target: Expression;
  key: PrivateKeyName;
  value: Expression;
};

export type InitializePrivateOperation = {
  type: "initialize-private";
  mode: Mode;
  kind: "method" | "getter" | "setter";
  key: PrivateKeyName;
  value: Expression;
};

export type RegisterPrivateSingletonOperation = {
  type: "register-private-singleton";
  mode: Mode;
  target: Expression;
};

export type RegisterPrivateCollectionOperation = {
  type: "register-private-collection";
  mode: Mode;
  target: Expression;
};

export type HasPrivateOperation = {
  type: "has-private";
  mode: Mode;
  target: Expression;
  key: PrivateKeyName;
};

export type GetPrivateOperation = {
  type: "get-private";
  mode: Mode;
  target: Expression;
  key: PrivateKeyName;
};

export type SetPrivateOperation = {
  type: "set-private";
  mode: Mode;
  target: Expression;
  key: PrivateKeyName;
  value: Expression;
};

export type PrivateLoadOperation = HasPrivateOperation | GetPrivateOperation;

export type PrivateSaveOperation =
  | DefinePrivateOperation
  | InitializePrivateOperation
  | RegisterPrivateSingletonOperation
  | RegisterPrivateCollectionOperation
  | SetPrivateOperation;

// union //

export type LoadOperation =
  | VariableLoadOperation
  | RoutineLoadOperation
  | CatchLoadOperation
  | PrivateLoadOperation
  | ReadImportOperation
  | ReadImportMetaOperation;

export type SaveOperation =
  | VariableSaveOperation
  | RoutineSaveOperation
  | PrivateSaveOperation;

export type Operation = LoadOperation | SaveOperation;

// method //

export type ListScopeEffect<S> = (
  hash: Hash,
  meta: Meta,
  scope: S,
  operation: SaveOperation,
) => Sequence<BodyPrelude, Effect[]>;

export type ListFrameEffect<F> = <S>(
  hash: Hash,
  meta: Meta,
  frame: F,
  operation: SaveOperation,
  listAlternateEffect: ListScopeEffect<S>,
  scope: S,
) => Sequence<BodyPrelude, Effect[]>;

export type makeScopeExpression<S> = (
  hash: Hash,
  meta: Meta,
  scope: S,
  operation: LoadOperation,
) => Sequence<BodyPrelude, Expression>;

export type MakeFrameExpression<F> = <S>(
  hash: Hash,
  meta: Meta,
  frame: F,
  operation: LoadOperation,
  makeAlternateExpression: makeScopeExpression<S>,
  scope: S,
) => Sequence<BodyPrelude, Expression>;
