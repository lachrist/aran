import { PrivateKey, Variable } from "../../estree";
import { Atom, Expression } from "../atom";

export { RootFrame } from "./root";

type Mode = "strict" | "sloppy";

// Variable //

export type DeclareOperation = {
  type: "declare";
  mode: Mode;
  kind: "eval";
  variable: Variable;
  configurable: true;
};

export type InitializeOperation = {
  type: "initialize";
  mode: Mode;
  kind: "let" | "const" | "var" | "val";
  manufactured: boolean;
  variable: Variable;
  right: Expression | null;
};

export type WriteOperation = {
  type: "write";
  mode: Mode;
  variable: Variable;
  right: Expression;
};

export type ReadOperation = {
  type: "read";
  mode: Mode;
  variable: Variable;
};

export type TypeofOperation = {
  type: "typeof";
  mode: Mode;
  variable: Variable;
};

export type DiscardOperation = {
  type: "discard";
  mode: Mode;
  variable: Variable;
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

export type WrapResultOperation = {
  type: "wrap-result";
  mode: Mode;
  result: Expression | null;
};

export type ClosureLoadOperation =
  | ReadThisOperation
  | ReadNewTargetOperation
  | ReadInputOperation
  | GetSuperOperation
  | WrapResultOperation;

export type ClosureSaveOperation = SetSuperOperation | CallSuperOperation;

// Private //

export type DefinePrivateOperation = {
  type: "define-private";
  mode: Mode;
  target: Expression;
  key: PrivateKey;
  value: Expression;
};

export type InitializePrivateOperation = {
  type: "initialize-private";
  mode: Mode;
  kind: "method" | "getter" | "setter";
  key: PrivateKey;
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
  key: PrivateKey;
};

export type GetPrivateOperation = {
  type: "get-private";
  mode: Mode;
  target: Expression;
  key: PrivateKey;
};

export type SetPrivateOperation = {
  type: "set-private";
  mode: Mode;
  target: Expression;
  key: PrivateKey;
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
  | ClosureLoadOperation
  | CatchLoadOperation
  | PrivateLoadOperation
  | ReadImportOperation
  | ReadImportMetaOperation;

export type SaveOperation =
  | VariableSaveOperation
  | ClosureSaveOperation
  | PrivateSaveOperation;

export type Operation = LoadOperation | SaveOperation;
