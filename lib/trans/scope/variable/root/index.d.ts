// We can't assume binding remained in the global object:
//
// > global.x = 123;
// > var x = 456;
// > delete x; >> true
// > "x" in global >> false
//
// So only bindings in the global declarative record are represented.

import type { VariableName } from "estree-sentry";
import type { WritableMetaVariable } from "../../../variable.d.ts";
import type { Tree } from "../../../../util/tree.d.ts";
import type { RootSort, Sort } from "../../../sort.d.ts";
import type { Mode } from "../../../mode.d.ts";
import type { Kind } from "../../../annotation/hoisting.d.ts";
import type { GlobalDeclarativeRecord } from "../../../config.d.ts";

export type RecordRootKind = Kind & ("let" | "const" | "class");

export type GlobalRootKind = Kind &
  ("var" | "function-strict" | "function-sloppy-away" | "function-sloppy-near");

export type RootKind = RecordRootKind | GlobalRootKind;

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
  sort: Sort;
  global_declarative_record: GlobalDeclarativeRecord;
  bindings: [VariableName, RootKind[]][];
};
