import { WritableCache } from "../../cache";

export type ReifyBinding = {
  type: "reify";
  record: "aran.global" | "aran.record";
  writable: boolean;
};

export type AlienBinding = {
  type: "alien";
  deadzone: null | WritableCache;
  writable: boolean;
};

export type Declare = {
  type: "declare";
  mode: "strict" | "sloppy";
  kind: "var" | "let" | "const";
  variable: estree.Variable;
};

export type AlienRootFrame = {
  type: "root";
  kind: "alien";
  mode: "strict" | "sloppy";
  sort: "script" | "module" | "eval.global" | "eval.local.root";
  record: {
    [k in estree.Variable]?: AlienBinding;
  };
};

export type ReifyRootFrame = {
  type: "root";
  kind: "reify";
  mode: "strict" | "sloppy";
  sort: "script" | "module" | "eval.global";
  record: {
    [k in estree.Variable]?: ReifyBinding;
  };
};

export type RootFrame = ReifyRootFrame | AlienRootFrame;
