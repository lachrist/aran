import type { Pointcut } from "../type/advice.js";

export type Locate<B, L> = (path: weave.OriginPath, base: B) => L;

export type Config<B, L> = {
  locate: Locate<B, L>;
  pointcut: Pointcut<L>;
  advice: estree.Variable;
  intrinsic: estree.Variable;
  escape: estree.Variable;
};
