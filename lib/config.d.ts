import type { Config as UnbuildConfig } from "./unbuild/config";
import type {
  StandardConfig as StandardWeaveConfig,
  FlexibleConfig as FlexibleWeaveConfig,
} from "./weave/config";
import type { Config as RebuildConfig } from "./rebuild/config";

export type CommonConfig = {
  warning: "embed" | "console" | "ignore" | "throw";
} & UnbuildConfig &
  RebuildConfig;

export type Config =
  | (StandardWeaveConfig & CommonConfig)
  | (FlexibleWeaveConfig & CommonConfig);

export type PartialConfig =
  | Partial<StandardWeaveConfig & CommonConfig>
  | (Partial<FlexibleWeaveConfig & CommonConfig> & { weaving: "flexible" });
