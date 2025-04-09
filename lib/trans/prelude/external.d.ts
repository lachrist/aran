import type { VariableName } from "estree-sentry";
import type { Hash } from "../hash.d.ts";
import type { RootKind } from "../scope/variable/root/index.d.ts";

export type ReifyExternal = {
  dynamic: boolean;
  kinds: RootKind[];
  variable: VariableName;
  origin: Hash;
};
