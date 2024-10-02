import type { VariableName } from "estree-sentry";
import type { ConstantMetaVariable } from "../../variable";

export type Sort = "script" | "module" | "eval.global" | "eval.local.root";

export type ReifyBinding = {
  frame: "record" | "global";
  write: "perform" | "report";
};

export type AlienBinding = {
  deadzone: null | ConstantMetaVariable;
  write: "perform" | "report";
};

export type Declare = {
  type: "declare";
  mode: "strict" | "sloppy";
  kind: "var" | "let" | "const";
  variable: VariableName;
};

export type AlienRootFrame = {
  type: "root";
  kind: "alien";
  mode: "strict" | "sloppy";
  sort: Sort;
  record: {
    [k in VariableName]?: AlienBinding;
  };
};

export type ReifyRootFrame = {
  type: "root";
  kind: "reify";
  mode: "strict" | "sloppy";
  sort: "script" | "module" | "eval.global";
  record: {
    [k in VariableName]?: ReifyBinding;
  };
};

export type RootFrame = ReifyRootFrame | AlienRootFrame;
