import type { Hash } from "../hash.d.ts";

export type WarningName =
  | "ExternalConstant"
  | "ExternalDeadzone"
  | "ExternalSloppyFunction"
  | "ExternalLateDeclaration";

export type RawWarning = {
  name: WarningName;
  hash: Hash;
};

export type Warning = {
  name: WarningName;
  hash: Hash;
  message: string;
};
