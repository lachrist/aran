import type { Config as EntireConfig } from "../config";

export type Config = {
  [key in "global_declarative_record" | "digest"]: EntireConfig[key];
};
