import type { Config as StandardConfigInner } from "./standard/config.d.ts";
import type { Config as FlexibleConfigInner } from "./flexible/config.d.ts";

export type StandardConfig = {
  weave: "standard";
} & StandardConfigInner;

export type FlexibleConfig = {
  weave: "flexible";
} & FlexibleConfigInner;

export type Config = StandardConfig | FlexibleConfig;
