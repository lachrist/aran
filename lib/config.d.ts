import { OriginPath } from "./weave/atom";
import { Pointcut } from "./weave/pointcut";

export type Locate<L> = (path: OriginPath) => L;

export type Config<L> = {
  mode: "normal" | "standalone";
  locate: Locate<L>;
  pointcut: Pointcut<L>;
  global_declarative_record: "native" | "emulate";
  global_variable: estree.Variable;
  advice_variable: estree.Variable;
  intrinsic_variable: estree.Variable;
  escape_prefix: estree.Variable;
  warning: "embed" | "console" | "ignore" | "throw";
  early_syntax_error: "embed" | "throw";
};
