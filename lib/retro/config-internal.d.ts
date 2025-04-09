import type { VariableName } from "estree-sentry";
import type { Config } from "./config.d.ts";

export type InternalConfig = Config<{
  JavaScriptIdentifier: VariableName;
}>;
