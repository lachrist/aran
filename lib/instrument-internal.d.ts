import type { VariableName } from "estree-sentry";
import type { ArgAtom } from "./weave/atom.d.ts";
import type { FilePath, Hash } from "./trans/hash.d.ts";
import type { Config } from "./instrument.d.ts";

export type InternalConfig = Config<
  ArgAtom & {
    JavaScriptIdentifier: VariableName;
    NodeHash: Hash;
    FilePath: FilePath;
  }
>;
