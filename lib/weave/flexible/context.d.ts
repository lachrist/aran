import type { ArgProgram } from "../atom.d.ts";
import type { Depth } from "../depth.d.ts";
import type { OptimalPointcut } from "./aspect-internal.d.ts";

export type Context = {
  depth: Depth;
  pointcut: OptimalPointcut;
  root: ArgProgram;
};
