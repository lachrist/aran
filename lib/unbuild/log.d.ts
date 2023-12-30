export type LogName =
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

export type Log = {
  name: LogName;
  message: string;
  path: unbuild.Path;
};
