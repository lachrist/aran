import { Variable } from "../estree";

export type Config = {
  mode: "normal" | "standalone";
  global_variable: Variable;
  intrinsic_variable: Variable;
  escape_prefix: Variable;
};
