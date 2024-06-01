import type { Path } from "../../path.js";
import type { DeepLocalContext } from "../../program.js";
import type { Depth } from "../depth.js";
import type { NormalPointcut } from "./pointcut.js";

export type EvalRecord = { [k in Path]?: DeepLocalContext };

export type Context = {
  depth: Depth;
  evals: EvalRecord;
  pointcut: NormalPointcut;
};
