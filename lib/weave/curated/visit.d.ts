import type { DeepLocalContext } from "../../program.d.ts";
import { OriginPath } from "../atom.js";
import { Pointcut } from "./pointcut.js";

export type Options<L> = {
  evals: { [k in OriginPath]?: DeepLocalContext };
  pointcut: Pointcut<L>;
  locate: (path: OriginPath) => L;
  advice: {
    kind: "object" | "function";
    variable: estree.Variable;
  };
};
