import type { Pointcut } from "../type/advice.js";

export type Locate<B, L> = (path: weave.OriginPath, base: B) => L;

export type Config<B, L> = {
  locate: Locate<B, L>;
  pointcut: Pointcut<L>;
  reify_global: boolean;
  global_variable: estree.Variable;
  advice_variable: estree.Variable;
  intrinsic_variable: estree.Variable | null;
  escape_prefix: estree.Variable;
};
