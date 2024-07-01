import type { Variable } from "../../../estree";
import type { WritableCache } from "../../cache";
import type { Write } from "../../query/hoist-public";

export type ReifyBinding = {
  frame: "record" | "global";
  write: Exclude<Write, "ignore">;
};

export type AlienBinding = {
  deadzone: null | WritableCache;
  write: Exclude<Write, "ignore">;
};

export type Declare = {
  type: "declare";
  mode: "strict" | "sloppy";
  kind: "var" | "let" | "const";
  variable: Variable;
};

export type AlienRootFrame = {
  type: "root";
  kind: "alien";
  mode: "strict" | "sloppy";
  sort: "script" | "module" | "eval.global" | "eval.local.root";
  record: {
    [k in Variable]?: AlienBinding;
  };
};

export type ReifyRootFrame = {
  type: "root";
  kind: "reify";
  mode: "strict" | "sloppy";
  sort: "script" | "module" | "eval.global";
  record: {
    [k in Variable]?: ReifyBinding;
  };
};

export type RootFrame = ReifyRootFrame | AlienRootFrame;
