import type { Config } from "./config.d.ts";
import type { ArgAtom } from "../atom.d.ts";
import type { Json } from "../../util/util.d.ts";
import type { VariableName } from "estree-sentry";

export type InternalConfig = Config<
  ArgAtom & {
    AdviceGlobalVariable: VariableName;
    InitialState: Json;
  }
>;
