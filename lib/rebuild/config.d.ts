import type { Config as EntireConfig } from "../config";

export type Config = {
  [key in
    | "mode"
    | "global_variable"
    | "intrinsic_variable"
    | "escape_prefix"]: EntireConfig[key];
};
