import type { VariableName } from "estree-sentry";
import type { Hash } from "../hash";
import type { RootKind } from "../scope/variable/root";

export type ReifyExternal = {
  kinds: RootKind[];
  variable: VariableName;
  origin: Hash;
};
