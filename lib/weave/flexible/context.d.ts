import type { ArgProgram } from "../atom";
import type { Depth } from "../depth";
import type { OptimalPointcut } from "./aspect-internal";

export type Context = {
  depth: Depth;
  pointcut: OptimalPointcut;
  root: ArgProgram;
};
