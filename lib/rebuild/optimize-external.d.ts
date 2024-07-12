import type { Variable } from "../estree";

export type Target =
  | "aran.readGlobal"
  | "aran.writeGlobal"
  | "aran.typeofGlobal"
  | "aran.discardGlobal"
  | "scope.read"
  | "scope.write"
  | "scope.typeof"
  | "scope.discard";

export type External = {
  target: Target;
  variable: Variable;
};
