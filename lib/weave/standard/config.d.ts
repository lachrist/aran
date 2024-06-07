import type { Pointcut } from "./aspect";
import type { Variable as EstreeVariable } from "../../estree";
import type { Json } from "../../json";

export type Config = {
  advice_variable: EstreeVariable;
  pointcut: Pointcut;
  initial: Json;
};
