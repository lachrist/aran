import type { Path } from "../../path";
import type { DeepLocalContext } from "../../program";
import type { Depth } from "../depth";
import type { NormalPointcut } from "./aspect";

export type EvalRecord = { [k in Path]?: DeepLocalContext };

export type Context = {
  depth: Depth;
  evals: EvalRecord;
  pointcut: NormalPointcut;
};
