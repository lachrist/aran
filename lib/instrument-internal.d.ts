import type { VariableName } from "estree-sentry";
import type { ArgAtom } from "./weave/atom";
import type { FilePath, Hash } from "./trans/hash";
import type { GlobalPropertyKey } from "./global_property_key";
import type { Json } from "./util/util";
import type { Config } from "./instrument";

export type InternalConfig = Config<
  Json,
  ArgAtom,
  Hash,
  VariableName,
  GlobalPropertyKey,
  FilePath
>;
