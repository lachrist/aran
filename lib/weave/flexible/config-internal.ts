import type { VariableName } from "estree-sentry";
import type { Json } from "../../util/util";
import type { ArgAtom } from "../atom";
import type { Config } from "./config";

export type InternalConfig = Config<{
  AdviceGlobalVariable: VariableName;
  InitialState: Json;
  Atom: ArgAtom;
  Point: Json[];
}>;
