import type { Depth } from "../depth.d.ts";
import type { NormalInternalPointcut } from "./aspect-internal.d.ts";

export type Context = {
  depth: Depth;
  pointcut: NormalInternalPointcut;
};
