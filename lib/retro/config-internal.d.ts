import type { VariableName } from "estree-sentry";
import type { Config } from "./config";

export type InternalConfig = Config<{
  JavaScriptIdentifier: VariableName;
}>;
