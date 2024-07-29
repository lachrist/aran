import type { Path } from "./path";

export type WarningName =
  | "ExternalConstant"
  | "ExternalDeadzone"
  | "ExternalSloppyFunction"
  | "ExternalLateDeclaration";

export type Warning = {
  name: WarningName;
  path: Path;
};
