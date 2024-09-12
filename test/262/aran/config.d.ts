import type { FlexiblePointcut, StandardPointcut } from "../../../lib";
import { Source } from "../source";

export type Config = {
  selection: "*" | Source["type"][];
  standard_pointcut: StandardPointcut | null;
  flexible_pointcut: FlexiblePointcut | null;
  global_declarative_record: "emulate" | "builtin";
  initial_state: import("../json").Json;
};
