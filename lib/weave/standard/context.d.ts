import type { Depth } from "../depth";
import type { NormalInternalPointcut } from "./pointcut";

export type Context = {
  depth: Depth;
  pointcut: NormalInternalPointcut;
};
