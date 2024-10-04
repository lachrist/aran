import type { Config as EntireConfig } from "../config";

export type Config = {
  [key in "initial_state" | "advice_variable" | "pointcut"]: EntireConfig[key];
};
