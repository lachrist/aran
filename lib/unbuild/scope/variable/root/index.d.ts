// We can't assume binding remained in the global object:
//
// > global.x = 123;
// > var x = 456;
// > delete x; >> true
// > "x" in global >> false
//
// So only bindings in the global declarative record are represented.

import type { VariableName } from "estree-sentry";
import type { WritableMetaVariable } from "../../../variable";
import type { Tree } from "../../../../util/tree";
import type { RootSort } from "../../../sort";
import type { Mode } from "../../../mode";
import type { Binding as RawBinding } from "../../../annotation/hoisting";
import type { GlobalDeclarativeRecord } from "../../../config";

export type Write = "perform" | "report";

export type Status = "live" | "dead" | "schrodinger";

export type Declare = {
  type: "declare";
  mode: Mode;
  kind: "var" | "let" | "const";
  variable: VariableName;
};

export type ReifyBinding = {
  variable: VariableName;
  status: Status;
  write: Write;
};

export type AlienBinding = {
  variable: VariableName;
  deadzone: WritableMetaVariable;
  status: Status;
  write: Write;
};

export type ReifyMatch = {
  binding: null | Omit<ReifyBinding, "variable">;
  root: RootSort;
};

export type AlienMatch = {
  binding: null | Omit<AlienBinding, "variable">;
  root: RootSort;
};

export type AlienFrame = {
  type: "root";
  kind: "alien";
  bindings: Tree<AlienBinding>;
};

export type ReifyFrame = {
  type: "root";
  kind: "reify";
  bindings: Tree<ReifyBinding>;
};

export type RootFrame = ReifyFrame | AlienFrame;

export type AlienBind = {
  root: RootSort;
  kind: "alien";
  bindings: Tree<AlienBinding>;
};

export type ReifyBind = {
  root: RootSort;
  kind: "reify";
  bindings: Tree<ReifyBinding>;
};

export type RootBind = AlienBind | ReifyBind;

export type RawRootFrame = {
  global_declarative_record: GlobalDeclarativeRecord;
  bindings: RawBinding[];
};
