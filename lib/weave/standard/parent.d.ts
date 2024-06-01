import type { Variable } from "../../estree";
import type { ArgExpression, ArgProgram } from "../atom";

export type Parent =
  | {
      type: "program";
      node: ArgProgram;
      advice: Variable;
    }
  | {
      type: "closure";
      node: ArgExpression & { type: "ClosureExpression" };
    };
