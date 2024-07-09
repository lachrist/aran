import type { Path } from "./path";

export type WarningName =
  | "ExternalConstant"
  | "ExternalDeadzone"
  | "ExternalSloppyFunction"
  | "LateExternalVariable"
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
