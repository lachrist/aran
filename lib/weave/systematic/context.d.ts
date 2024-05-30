import type { Path } from "../../path.js";
import type { DeepLocalContext } from "../../program.js";
import type { ArgProgram } from "../atom.d.ts";
import type { Depth } from "../depth.js";
import type { AspectPointcut } from "./pointcut.js";

export type EvalRecord = { [k in Path]?: DeepLocalContext };

export type Context = {
  depth: Depth;
  evals: EvalRecord;
  pointcut: AspectPointcut;
  root: ArgProgram;
};
