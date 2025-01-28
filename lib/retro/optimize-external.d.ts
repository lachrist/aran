import type { Statement, VariableName } from "estree-sentry";

export type Target =
  | "scope.read"
  | "scope.writeSloppy"
  | "scope.writeStrict"
  | "scope.typeof"
  | "scope.discard"
  | "aran.readGlobalVariable"
  | "aran.writeGlobalVariableStrict"
  | "aran.writeGlobalVariableSloppy"
  | "aran.typeofGlobalVariable"
  | "aran.discardGlobalVariable";

export type External = {
  target: Target;
  variable: VariableName;
};

export type Optimization = {
  strict: Statement<{}>[];
  sloppy: Statement<{}>[];
  either: Statement<{}>[];
};
