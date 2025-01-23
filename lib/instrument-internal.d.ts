import type { VariableName } from "estree-sentry";
import type { ArgAtom } from "./weave/atom";
import type { FilePath, Hash } from "./trans/hash";
import type { Json } from "./util/util";
import type { Config } from "./instrument";

export type InternalConfig = Config<
  ArgAtom & {
    JavaScriptIdentifier: VariableName;
    InitialState: Json;
    NodeHash: Hash;
    FilePath: FilePath;
  }
>;
