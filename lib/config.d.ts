import type { Json } from "./util";
import type { Pointcut as GenericStandardPointcut } from "./weave/standard/aspect";
import type { Pointcut as GenericFlexiblePointcut } from "./weave/flexible/aspect";
import type { VariableName } from "estree-sentry";
import type { Hash } from "./hash";

export type StandardPointcut = GenericStandardPointcut<Hash>;

export type FlexiblePointcut = GenericFlexiblePointcut<Hash>;

export type Pointcut =
  | { type: "standard"; data: StandardPointcut }
  | { type: "flexible"; data: FlexiblePointcut };

export type Config = {
  mode: "normal" | "standalone";
  pointcut: Pointcut;
  initial_state: Json;
  global_declarative_record: "builtin" | "emulate";
  global_variable: VariableName;
  intrinsic_variable: VariableName;
  advice_variable: VariableName;
  escape_prefix: VariableName;
};
