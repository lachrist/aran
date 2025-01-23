import type { Config } from "./config";
import type { ArgAtom } from "../atom";
import type { Json } from "../../util/util";
import type { VariableName } from "estree-sentry";

export type InternalConfig = Config<
  ArgAtom & {
    JavaScriptIdentifier: VariableName;
    InitialState: Json;
  }
>;
