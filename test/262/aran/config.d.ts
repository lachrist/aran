import type { FlexiblePointcut, Json, StandardPointcut } from "../../../";
import { Source } from "../source";

export type NodeHash = string & {
  __brand: "test.config.hash";
};

export type FilePath = string & {
  __brand: "test.config.path";
};

export type Config = {
  selection: "*" | Source["type"][];
  standard_pointcut: StandardPointcut<NodeHash> | null;
  flexible_pointcut: FlexiblePointcut<NodeHash> | null;
  global_declarative_record: "emulate" | "builtin";
  initial_state: Json;
};
