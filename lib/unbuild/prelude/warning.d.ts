import type { Hash } from "../../hash";

export type WarningName =
  | "ExternalConstant"
  | "ExternalDeadzone"
  | "ExternalSloppyFunction"
  | "ExternalLateDeclaration";

export type Warning = {
  name: WarningName;
  hash: Hash;
};
