import type { Config as StandardConfigInner } from "./standard/config.d.ts";
import type { Config as FlexibleConfigInner } from "./flexible/config.d.ts";

export type StandardConfig = {
  weaving: "standard";
} & StandardConfigInner;

export type FlexibleConfig = {
  weaving: "flexible";
} & FlexibleConfigInner;

export type Config = StandardConfig | FlexibleConfig;
