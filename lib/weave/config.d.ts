import type { Pointcut as StandardPointcut } from "./standard/aspect";
import type { Pointcut as FlexiblePointcut } from "./flexible/aspect";
import type { Variable as EstreeVariable } from "../estree";

export { StandardPointcut, FlexiblePointcut };

export type StandardConfig = {
  weave: "standard";
  advice_variable: EstreeVariable;
  pointcut: StandardPointcut;
};

export type FlexibleConfig = {
  weave: "flexible";
  pointcut: FlexiblePointcut;
};

export type Config = StandardConfig | FlexibleConfig;
