import type { Path } from "./path";

export type WarningName =
  | "ExternalConstant"
  | "ExternalDeadzone"
  | "ExternalSloppyFunction"
  | "SloppyBlockFunctionDeclaration"
  | "StrictKeywordExternalVariable"
  | "StrictReadonlyExternalVariableWrite"
  | "ExternalVariableClash"
  | "DirectEvalExternalVariableDeclaration"
  | "KeywordLocalExternalRead"
  | "KeywordLocalExternalTypeof"
  | "SloppyLocalExternalDiscard"
  | "SloppyLocalExternalWrite"
  | "KeywordLocalExternalWrite";

export type Warning = {
  name: WarningName;
  path: Path;
};
