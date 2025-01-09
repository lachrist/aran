import type { ArgProgram } from "../atom";
import type { Depth } from "../depth";
import type { OptimalPointcut } from "./aspect";

export type Context = {
  depth: Depth;
  pointcut: OptimalPointcut;
  root: ArgProgram;
};
