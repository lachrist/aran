import type { DeepLocalContext } from "../../program.js";
import type { Path } from "../../path.js";
import type { Pointcut } from "./pointcut.js";
import type { Variable } from "../../estree.js";

export type Options<L> = {
  evals: { [k in Path]?: DeepLocalContext };
  pointcut: Pointcut<L>;
  locate: (path: Path) => L;
  advice: {
    kind: "object" | "function";
    variable: Variable;
  };
};
