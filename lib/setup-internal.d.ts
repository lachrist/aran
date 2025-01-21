import type { VariableName } from "estree-sentry";
import type { Config } from "./setup";
import type { GlobalPropertyKey } from "./global_property_key";

export type InternalConfig = Config<VariableName, GlobalPropertyKey>;
