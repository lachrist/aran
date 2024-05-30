import { Path } from "./path";
import { Pointcut } from "./weave/curated/pointcut";

export type Locate<L> = (path: Path) => L;

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
