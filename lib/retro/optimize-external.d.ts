import type { Statement, VariableName } from "estree-sentry";

export type Target =
  | "scope.read"
  | "scope.writeSloppy"
  | "scope.writeStrict"
  | "scope.typeof"
  | "scope.discard"
  | "aran.readGlobalVariable"
  | "aran.writeGlobalStrict"
  | "aran.writeGlobalSloppy"
  | "aran.typeofGlobalVariable"
  | "aran.discardGlobal";

export type External = {
  target: Target;
  variable: VariableName;
};

export type Optimization = {
  strict: Statement<{}>[];
  sloppy: Statement<{}>[];
  either: Statement<{}>[];
};
