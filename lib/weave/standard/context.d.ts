import type { Depth } from "../depth";
import type { NormalPointcut } from "./aspect";

export type Context = {
  depth: Depth;
  pointcut: NormalPointcut;
};
