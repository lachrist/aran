import { Path } from "../path";

export type WarningName =
  | "ExternalConstant"
  | "ExternalDeadzone"
  | "SloppyBlockFunctionDeclaration"
  | "StrictKeywordExternalVariable"
  | "StrictReadonlyExternalVariableWrite"
  | "ExternalVariableClash"
  | "GeneratorParameterPattern"
  | "DirectEvalExternalVariableDeclaration"
  | "KeywordLocalExternalRead"
  | "KeywordLocalExternalTypeof"
  | "SloppyLocalExternalDiscard"
  | "SloppyLocalExternalWrite"
  | "KeywordLocalExternalWrite";

export type Warning = {
  name: WarningName;
  message: string;
  path: Path;
};
