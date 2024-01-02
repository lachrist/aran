import { Path } from "../../../type/unbuild";
import { Cache } from "../cache";
import { BlockFrame } from "./block";
import { ClosureFrame } from "./closure";
import { EvalFrame } from "./eval";
import { ExternalFrame } from "./external";
import { FakeFrame } from "./fake";
import { GlobalObjectFrame } from "./global-object";
import { GlobalRecordFrame } from "./global-record";
import { ModeFrame } from "./mode";
import { PrivateFrame } from "./private";
import { RootFrame } from "./root";
import { TemplateFrame } from "./template";
import { WithFrame } from "./with";

type Mode = "strict" | "sloppy";

///////////
// Frame //
///////////

export type NodeFrame =
  | BlockFrame
  | ClosureFrame
  | EvalFrame
  | ExternalFrame
  | FakeFrame
  | GlobalObjectFrame
  | GlobalRecordFrame
  | ModeFrame
  | PrivateFrame
  | TemplateFrame
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

///////////////
// Operation //
///////////////

// Variable //

export type InitializeOperation = {
  type: "initialize";
  mode: Mode;
  kind: "let" | "const" | "var";
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

export type VariableSaveOperation = InitializeOperation | WriteOperation;

// Closure //

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
  | ReadErrorOperation
  | GetSuperOperation
  | WrapResultOperation;

export type ClosureSaveOperation = SetSuperOperation | CallSuperOperation;

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

export type TemplateLoadOperation = HasTemplateOperation | GetTemplateOperation;

export type TemplateSaveOperation = SetTemplateOperation;

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

// union //

export type LoadOperation =
  | VariableLoadOperation
  | ClosureLoadOperation
  | TemplateLoadOperation
  | PrivateLoadOperation;

export type SaveOperation =
  | VariableSaveOperation
  | ClosureSaveOperation
  | TemplateSaveOperation
  | PrivateSaveOperation;

export type Operation = LoadOperation | SaveOperation;
