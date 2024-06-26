import { OriginPath } from "./weave/atom";
import { Pointcut } from "./weave/pointcut";

export type Locate<B, L> = (path: OriginPath, base: B) => L;

export type Config<B, L> = {
  mode: "normal" | "standalone";
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
