/**
 * @type {{
 *   [key in import("./warning").WarningName]: string
 * }}
 */
export const WARNING_MESSAGE = {
  ExternalConstant: "External constant",
  ExternalDeadzone: "External deadzone",
  ExternalSloppyFunction: "External sloppy function",
  LateExternalVariable: "Late external variable",
  StrictKeywordExternalVariable: "Strict keyword external variable",
  StrictReadonlyExternalVariableWrite:
    "Strict readonly external variable write",
  ExternalVariableClash: "External variable clash",
  DirectEvalExternalVariableDeclaration:
    "Direct eval external variable declaration",
  KeywordLocalExternalRead: "Keyword local external read",
  KeywordLocalExternalTypeof: "Keyword local external typeof",
  SloppyLocalExternalDiscard: "Sloppy local external discard",
  SloppyLocalExternalWrite: "Sloppy local external write",
  KeywordLocalExternalWrite: "Keyword local external write",
};
