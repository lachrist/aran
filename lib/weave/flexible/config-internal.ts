import type { VariableName } from "estree-sentry";
import type { Json } from "../../util/util.d.ts";
import type { ArgAtom } from "../atom.d.ts";
import type { Config } from "./config.d.ts";

export type InternalConfig = Config<
  ArgAtom & {
    AdviceGlobalVariable: VariableName;
    InitialState: Json;
    Point: Json[];
  }
>;
