import { Path } from "../../../type/unbuild";
import { Cache } from "../cache";
import { RegularFrame } from "./variable-regular";
import { ClosureFrame } from "./closure";
import { EvalFrame } from "./variable-eval";
import { FakeFrame } from "./variable-fake";
import { ModeFrame } from "./mode";
import { PrivateFrame } from "./private";
import { RootFrame } from "./root";
import { WithFrame } from "./variable-with";
import { CatchFrame } from "./catch";

export { RootFrame } from "./root";

type Mode = "strict" | "sloppy";

///////////
// Frame //
///////////

export type NodeFrame =
  | RegularFrame
  | ClosureFrame
  | CatchFrame
  | EvalFrame
  | FakeFrame
  | ModeFrame
  | PrivateFrame
  | WithFrame;

export type Frame = RootFrame | NodeFrame;

///////////
// Scope //
///////////

export type NodeScope = {
  frame: NodeFrame;
  parent: Scope;
};

export type RootScope = {
  frame: RootFrame;
  parent: null;
};

export type Scope = NodeScope | RootScope;

export type PackScope = [RootFrame, ...NodeFrame[]];

///////////////
// Operation //
///////////////

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
  right: Cache | null;
};

export type WriteOperation = {
  type: "write";
  mode: Mode;
  variable: estree.Variable;
  right: Cache;
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
  key: Cache;
};

export type SetSuperOperation = {
  type: "set-super";
  mode: Mode;
  key: Cache;
  value: Cache;
};

export type CallSuperOperation = {
  type: "call-super";
  mode: Mode;
  input: Cache;
};

export type WrapResultOperation = {
  type: "wrap-result";
  mode: Mode;
  result: Cache | null;
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
  target: Cache;
  key: estree.PrivateKey;
  value: Cache;
};

export type InitializePrivateOperation = {
  type: "initialize-private";
  mode: Mode;
  kind: "method" | "getter" | "setter";
  key: estree.PrivateKey;
  value: Cache;
};

export type RegisterPrivateSingletonOperation = {
  type: "register-private-singleton";
  mode: Mode;
  target: Cache;
};

export type RegisterPrivateCollectionOperation = {
  type: "register-private-collection";
  mode: Mode;
  target: Cache;
};

export type HasPrivateOperation = {
  type: "has-private";
  mode: Mode;
  target: Cache;
  key: estree.PrivateKey;
};

export type GetPrivateOperation = {
  type: "get-private";
  mode: Mode;
  target: Cache;
  key: estree.PrivateKey;
};

export type SetPrivateOperation = {
  type: "set-private";
  mode: Mode;
  target: Cache;
  key: estree.PrivateKey;
  value: Cache;
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
  | PrivateSaveOperation;

export type Operation = LoadOperation | SaveOperation;
