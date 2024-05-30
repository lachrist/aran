import type { Variable } from "./estree";
import type { Path } from "./path";
import type { Pointcut } from "./weave/curated/pointcut";

export type Locate<L> = (path: Path) => L;

export type Config<L> = {
  mode: "normal" | "standalone";
  locate: Locate<L>;
  pointcut: Pointcut<L>;
  global_declarative_record: "native" | "emulate";
  global_variable: Variable;
  advice_variable: Variable;
  intrinsic_variable: Variable;
  escape_prefix: Variable;
  warning: "embed" | "console" | "ignore" | "throw";
  early_syntax_error: "embed" | "throw";
};
