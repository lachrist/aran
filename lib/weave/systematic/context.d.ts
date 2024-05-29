import type { DeepLocalContext } from "../../program.js";
import type { ArgProgram, OriginPath } from "../atom.d.ts";
import type { Depth } from "./depth.d.ts";
import { AspectPointcut } from "./pointcut.js";

export type EvalRecord = { [k in OriginPath]?: DeepLocalContext };

export type Context = {
  depth: Depth;
  evals: EvalRecord;
  pointcut: AspectPointcut;
  root: ArgProgram;
};