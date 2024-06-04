import type { Path } from "../../path.js";
import type { DeepLocalContext } from "../../program.js";
import type { ArgProgram } from "../atom";
import type { Depth } from "../depth.js";
import type { OptimalPointcut } from "./aspect.js";

export type EvalRecord = { [k in Path]?: DeepLocalContext };

export type Context = {
  depth: Depth;
  evals: EvalRecord;
  pointcut: OptimalPointcut;
  root: ArgProgram;
};
