import type { VariableName } from "estree-sentry";
import type { Config } from "./setup";

export type InternalConfig = Config<{ JavaScriptIdentifier: VariableName }>;
