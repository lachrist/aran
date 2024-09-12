import type { FlexiblePointcut, StandardPointcut } from "../../../lib";

export type Config = {
  selection: "*" | "main";
  standard_pointcut: StandardPointcut | null;
  flexible_pointcut: FlexiblePointcut | null;
  global_declarative_record: "emulate" | "builtin";
  initial_state: import("../json").Json;
};
