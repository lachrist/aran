const { undefined } = globalThis;

export const CLASS = {
  type: "Class",
  name: undefined,
};

export const CLOSURE = {
  type: "Closure",
  kind: undefined,
  super: null,
  name: undefined,
};

export const UPDATE_EXPRESSION = {
  type: "UpdateExpression",
  operator: undefined,
  prefix: undefined,
};

export const UPDATE_EFFECT = {
  type: "UpdateEffect",
  operator: undefined,
  prefix: undefined,
};

export const ASSIGNMENT_EXPRESSION = {
  type: "AssignmentExpression",
  operator: "=",
  right: undefined,
};

export const ASSIGNMENT_EFFECT = {
  type: "AssignmentEffect",
  operator: "=",
  right: undefined,
};

export const PROGRAM = { type: "Program" };

export const STATEMENT = { type: "Statement" };

export const EFFECT = { type: "Effect" };

export const CALLEE = { type: "Callee" };

export const EXPRESSION_MACRO = {
  type: "ExpressionMacro",
  name: "",
  info: "macro",
};

export const PATTERN = {
  type: "Pattern",
  kind: null,
  right: undefined,
};

export const PATTERN_ELEMENT = {
  type: "PatternElement",
  kind: null,
  iterator: undefined,
};

export const PATTERN_PROPERTY = {
  type: "PatternProperty",
  kind: null,
  keys: null,
  right: undefined,
};

export const KEY_EXPRESSION_MACRO = { ...EXPRESSION_MACRO, info: "key" };

export const EXPRESSION = {
  type: "Expression",
  name: "",
};

export const QUASI = { type: "Quasi" };

export const QUASI_RAW = { type: "QuasiRaw" };

export const DELETE = { type: "Delete" };

export const KEY = { type: "Key" };

export const KEY_MACRO = { type: "KeyMacro" };

export const getKeySite = (computed) => (computed ? EXPRESSION : KEY);

export const getKeyMacroSite = (computed) =>
  computed ? KEY_EXPRESSION_MACRO : KEY_MACRO;
