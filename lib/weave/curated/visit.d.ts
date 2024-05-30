import type { DeepLocalContext } from "../../program.d.ts";
import { Path } from "../../path.js";
import { Pointcut } from "./pointcut.js";
import { Variable } from "../../estree.js";

export type Options<L> = {
  evals: { [k in Path]?: DeepLocalContext };
  pointcut: Pointcut<L>;
  locate: (path: Path) => L;
  advice: {
    kind: "object" | "function";
    variable: Variable;
  };
};
