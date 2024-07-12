import type { Statement, Variable } from "../estree";

export type Target =
  | "scope.read"
  | "scope.writeSloppy"
  | "scope.writeStrict"
  | "scope.typeof"
  | "scope.discard"
  | "aran.readGlobal"
  | "aran.writeGlobalStrict"
  | "aran.writeGlobalSloppy"
  | "aran.typeofGlobal"
  | "aran.discardGlobal";

export type External = {
  target: Target;
  variable: Variable;
};

export type Optimization = {
  strict: Statement[];
  sloppy: Statement[];
  either: Statement[];
};
