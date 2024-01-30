import { Cache } from "../cache";
import { InternalLocalContext } from "../../context";
import { ModuleHeader } from "../../header";
import { ExpressionSequence } from "../sequence";

export { RootFrame } from "./root";

type Mode = "strict" | "sloppy";

// Variable //

export type DeclareOperation = {
  type: "declare";
  mode: Mode;
  kind: "var";
  variable: estree.Variable;
  configurable: true;
};

export type InitializeOperation = {
  type: "initialize";
  mode: Mode;
  kind: "let" | "const" | "var" | "val";
  manufactured: boolean;
  variable: estree.Variable;
  right: ExpressionSequence | null;
};

export type WriteOperation = {
  type: "write";
  mode: Mode;
  variable: estree.Variable;
  right: ExpressionSequence;
};

export type ReadOperation = {
  type: "read";
  mode: Mode;
  variable: estree.Variable;
};

export type TypeofOperation = {
  type: "typeof";
  mode: Mode;
  variable: estree.Variable;
};

export type DiscardOperation = {
  type: "discard";
  mode: Mode;
  variable: estree.Variable;
};

export type VariableLoadOperation =
  | ReadOperation
  | TypeofOperation
  | DiscardOperation;

export type VariableSaveOperation =
  | InitializeOperation
  | WriteOperation
  | DeclareOperation;

export type VariableOperation = VariableLoadOperation | VariableSaveOperation;

// Root //

export type ReadImportOperation = {
  type: "read-import-dynamic";
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

// Closure //

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
  key: ExpressionSequence;
};

export type SetSuperOperation = {
  type: "set-super";
  mode: Mode;
  key: ExpressionSequence;
  value: ExpressionSequence;
};

export type CallSuperOperation = {
  type: "call-super";
  mode: Mode;
  input: ExpressionSequence;
};

export type WrapResultOperation = {
  type: "wrap-result";
  mode: Mode;
  result: ExpressionSequence | null;
};

export type ClosureLoadOperation =
  | ReadThisOperation
  | ReadNewTargetOperation
  | ReadInputOperation
  | GetSuperOperation
  | WrapResultOperation;

export type ClosureSaveOperation = SetSuperOperation | CallSuperOperation;

// Module //

export type ModuleOperation = {
  type: "module";
  header: ModuleHeader;
};

// Private //

export type DefinePrivateOperation = {
  type: "define-private";
  mode: Mode;
  target: ExpressionSequence;
  key: estree.PrivateKey;
  value: ExpressionSequence;
};

export type InitializePrivateOperation = {
  type: "initialize-private";
  mode: Mode;
  kind: "method" | "getter" | "setter";
  key: estree.PrivateKey;
  value: ExpressionSequence;
};

export type RegisterPrivateSingletonOperation = {
  type: "register-private-singleton";
  mode: Mode;
  target: ExpressionSequence;
};

export type RegisterPrivateCollectionOperation = {
  type: "register-private-collection";
  mode: Mode;
  target: ExpressionSequence;
};

export type HasPrivateOperation = {
  type: "has-private";
  mode: Mode;
  target: ExpressionSequence;
  key: estree.PrivateKey;
};

export type GetPrivateOperation = {
  type: "get-private";
  mode: Mode;
  target: ExpressionSequence;
  key: estree.PrivateKey;
};

export type SetPrivateOperation = {
  type: "set-private";
  mode: Mode;
  target: ExpressionSequence;
  key: estree.PrivateKey;
  value: ExpressionSequence;
};

export type PrivateLoadOperation = HasPrivateOperation | GetPrivateOperation;

export type PrivateSaveOperation =
  | DefinePrivateOperation
  | InitializePrivateOperation
  | RegisterPrivateSingletonOperation
  | RegisterPrivateCollectionOperation
  | SetPrivateOperation;

// eval //

export type EvalOperation = {
  type: "eval";
  mode: Mode;
  code: Cache;
  context: InternalLocalContext;
};

// union //

export type LoadOperation =
  | VariableLoadOperation
  | ClosureLoadOperation
  | CatchLoadOperation
  | PrivateLoadOperation
  | ReadImportOperation
  | ReadImportMetaOperation
  | EvalOperation;

export type SaveOperation =
  | VariableSaveOperation
  | ClosureSaveOperation
  | PrivateSaveOperation
  | ModuleOperation;

export type Operation = LoadOperation | SaveOperation;
