import type { VariableName } from "estree-sentry";
import type { Hash } from "../hash";
import type { RootKind } from "../scope/variable/root";

export type ReifyExternal = {
  dynamic: boolean;
  kinds: RootKind[];
  variable: VariableName;
  origin: Hash;
};
