import type { Pointcut } from "./aspect";
import type { Json } from "../../json";

export type Config = {
  pointcut: Pointcut;
  initial: Json;
};
