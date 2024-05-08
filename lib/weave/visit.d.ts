import { Locate } from "../config.js";
import type { DeepLocalContext } from "../program.d.ts";
import { Header } from "../header.js";
import { OriginPath } from "./atom.js";
import { Pointcut } from "./pointcut.js";

export type Options<B, L> = {
  evals: { [k in OriginPath]?: DeepLocalContext };
  base: B;
  pointcut: Pointcut<L>;
  locate: Locate<B, L>;
  advice: {
    kind: "object" | "function";
    variable: estree.Variable;
  };
};
