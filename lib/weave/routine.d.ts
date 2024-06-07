import type { Json } from "../json";
import type { Variable as EstreeVariable } from "../estree";
import type { ArgExpression, ArgProgram } from "./atom";
import type { Rename } from "./rename";

export type Routine =
  | {
      type: "program";
      node: ArgProgram;
      renaming: [EstreeVariable, Rename][];
      initial: Json;
    }
  | {
      type: "closure";
      node: ArgExpression & { type: "ClosureExpression" };
    };
