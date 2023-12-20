import { DynamicFrame } from "./dynamic";
import { ClosureFrame } from "./closure";
import { PrivateFrame } from "./private";
import { RootFrame } from "./root";
import { StaticFrame } from "./static";
import { ModeFrame } from "./mode";
import { Cache } from "../cache";
import { Init } from "v8";

type Mode = "strict" | "sloppy";

///////////
// Frame //
///////////

export type Frame =
  | RootFrame
  | StaticFrame
  | DynamicFrame
  | ClosureFrame
  | PrivateFrame
  | ModeFrame;

///////////
// Scope //
///////////

export type ModeScope = {
  frame: ModeFrame;
  parent: Scope;
};

export type RootScope = {
  frame: RootFrame;
  parent: null;
};

export type StaticScope = {
  frame: StaticFrame;
  parent: Scope;
};

export type DynamicScope = {
  frame: DynamicFrame;
  parent: Scope;
};

export type ParamScope = {
  frame: ClosureFrame;
  parent: Scope;
};

export type PrivateScope = {
  frame: PrivateFrame;
  parent: Scope;
};

export type Scope =
  | ModeScope
  | RootScope
  | StaticScope
  | DynamicScope
  | ParamScope
  | PrivateScope;

///////////////
// Operation //
///////////////

// Regular //

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

export type WriteOperation = {
  type: "write";
  mode: Mode;
  variable: estree.Variable;
  right: Cache;
};

export type InitializeOperation = {
  type: "initialize";
  mode: Mode;
  variable: estree.Variable;
  right: Cache | null;
};

// Parameter //

export type ReadThisOperation = {
  type: "read-this";
  mode: Mode;
};

export type ReadErrorOperation = {
  type: "read-error";
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

export type ReadImportOperation = {
  type: "read-import";
  mode: Mode;
};

export type ReadImportMetaOperation = {
  type: "read-import-meta";
  mode: Mode;
};

// Super //

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
  result: Cache;
};

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

// export //

export type LoadOperation =
  | ReadOperation
  | TypeofOperation
  | ReadErrorOperation
  | DiscardOperation
  | ReadThisOperation
  | ReadNewTargetOperation
  | ReadInputOperation
  | ReadImportOperation
  | ReadImportMetaOperation
  | GetSuperOperation
  | WrapResultOperation
  | HasPrivateOperation
  | GetPrivateOperation;

export type SaveOperation =
  | WriteOperation
  | InitializeOperation
  | SetSuperOperation
  | CallSuperOperation
  | DefinePrivateOperation
  | InitializePrivateOperation
  | RegisterPrivateSingletonOperation
  | RegisterPrivateCollectionOperation
  | SetPrivateOperation;

export type Operation = LoadOperation | SaveOperation;
