import type { VariableName } from "estree-sentry";
import type { ArgAtom } from "./weave/atom";
import type { FilePath, Hash } from "./trans/hash";
import type { Json } from "./util/util";
import type { GenericConfig } from "./instrument";

export type InternalConfig = GenericConfig<
  Json,
  ArgAtom,
  Hash,
  VariableName,
  FilePath
>;
