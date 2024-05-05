import { Locate } from "../config.js";
import type { Context } from "../context.d.ts";
import { Header } from "../header.js";
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
