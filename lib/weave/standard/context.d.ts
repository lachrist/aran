import type { Depth } from "../depth";
import type { NormalInternalPointcut } from "./aspect-internal";

export type Context = {
  depth: Depth;
  pointcut: NormalInternalPointcut;
};
