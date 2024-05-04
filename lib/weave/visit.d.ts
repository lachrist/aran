import { Locate } from "../config.js";
import type { Context } from "../context.d.ts";
import { OriginPath } from "./atom.js";
import { Pointcut } from "./pointcut.js";

export type Options<B, L> = {
  evals: { [k in OriginPath]?: Context };
  base: B;
  pointcut: Pointcut<L>;
  locate: Locate<B, L>;
  advice: {
    kind: "object" | "function";
    variable: estree.Variable;
  };
};

export type ControlParent = {
  kind: "try" | "catch" | "finally" | "naked" | "loop" | "then" | "else";
};

export type ClosureParent =
  | {
      type: "closure";
      kind: "arrow" | "function";
      asynchronous: boolean;
      generator: boolean;
    }
  | {
      type: "program";
      kind: "module" | "script" | "eval";
      situ: "global" | "local.root" | "local.deep";
    };
