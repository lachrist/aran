import type { Pointcut } from "./aspect";
import type { Json } from "../../json";

export type Config = {
  advice_variable?: unknown;
  pointcut: Pointcut;
  initial: Json;
};
