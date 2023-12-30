import { DynamicFrame } from "./dynamic";
import { ClosureFrame } from "./closure";
import { PrivateFrame } from "./private";
import { RootFrame } from "./root";
import { StaticFrame } from "./static";
import { ModeFrame } from "./mode";
import { Cache } from "../cache";
import { Path } from "../../../type/unbuild";

type Mode = "strict" | "sloppy";

///////////
// Frame //
///////////

export type NodeFrame =
  | StaticFrame
  | DynamicFrame
  | ClosureFrame
  | PrivateFrame
  | ModeFrame;

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

///////////////
// Operation //
///////////////

// Variable //

export type InitializeOperation = {
  type: "initialize";
  mode: Mode;
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

// Template //

export type HasTemplateOperation = {
  type: "has-template";
  mode: Mode;
  path: Path;
};

export type GetTemplateOperation = {
  type: "get-template";
  mode: Mode;
  path: Path;
};

export type SetTemplateOperation = {
  type: "set-template";
  mode: Mode;
  path: Path;
  template: Cache;
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
  result: Cache | null;
};

// Private //

// Property //
export type DefinePrivateOperation = {
  type: "define-private";
  mode: Mode;
  target: Cache;
  key: estree.PrivateKey;
  value: Cache;
};

// Method //
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
  | HasTemplateOperation
  | GetTemplateOperation
  | ReadInputOperation
  | ReadImportOperation
  | ReadImportMetaOperation
  | GetSuperOperation
  | WrapResultOperation
  | HasPrivateOperation
  | GetPrivateOperation;

export type SaveOperation =
  | InitializeOperation
  | WriteOperation
  | SetSuperOperation
  | SetTemplateOperation
  | CallSuperOperation
  | DefinePrivateOperation
  | InitializePrivateOperation
  | RegisterPrivateSingletonOperation
  | RegisterPrivateCollectionOperation
  | SetPrivateOperation;

export type Operation = LoadOperation | SaveOperation;
