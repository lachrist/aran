// We can't assume binding remained in the global object:
// > global.x = 123;
// > var x = 456;
// > delete x; >> true
// > "x" in global >> false

import type { VariableName } from "estree-sentry";
import type { WritableMetaVariable } from "../../../variable";
import type { Tree } from "../../../../util/tree";
import type { RootSort } from "../../../sort";
import type { Mode } from "../../../mode";

export type Write = "perform" | "report";

export type Initialization = "yes" | "no";

export type ReifyBinding = {
  variable: VariableName;
  initialization: Initialization;
  write: Write;
};

export type ReifyBind = {
  binding: null | Omit<ReifyBinding, "variable">;
  mode: Mode;
};

export type AlienBinding = {
  variable: VariableName;
  deadzone: WritableMetaVariable;
  initialization: Initialization;
  write: Write;
};

export type AlienBind = {
  binding: null | Omit<AlienBinding, "variable">;
  mode: Mode;
  root: RootSort;
};

export type Declare = {
  type: "declare";
  mode: Mode;
  kind: "var" | "let" | "const";
  variable: VariableName;
};

export type DryAlienRootFrame = {
  type: "root";
  kind: "alien";
  bindings: Tree<AlienBinding>;
};

export type AlienRootFrame = DryAlienRootFrame & {
  mode: Mode;
  root: RootSort;
};

export type DryReifyRootFrame = {
  type: "root";
  kind: "reify";
  bindings: Tree<ReifyBinding>;
};

export type ReifyRootFrame = DryReifyRootFrame & {
  mode: Mode;
};

export type DryRootFrame = DryReifyRootFrame | DryAlienRootFrame;

export type RootFrame = ReifyRootFrame | AlienRootFrame;
