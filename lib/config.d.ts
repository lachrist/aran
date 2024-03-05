import type { Pointcut } from "../type/advice.js";

export type Locate<B, L> = (path: weave.OriginPath, base: B) => L;

export type Config<B, L> = {
  mode: "default" | "standalone";
  locate: Locate<B, L>;
  pointcut: Pointcut<L>;
  global_declarative_record: "native" | "emulate";
  global_variable: estree.Variable;
  advice_variable: estree.Variable;
  intrinsic_variable: estree.Variable;
  escape_prefix: estree.Variable;
  warning: "embed" | "console" | "ignore" | "throw";
  early_syntax_error: "embed" | "throw";
};
