import { hasNarrowKey } from "./util/index.mjs";

const {
  Reflect: { ownKeys: listKey },
} = globalThis;

export const KEYWORD_RECORD = {
  break: null,
  case: null,
  catch: null,
  class: null,
  const: null,
  continue: null,
  debugger: null,
  default: null,
  delete: null,
  do: null,
  else: null,
  enum: null,
  export: null,
  extends: null,
  false: null,
  finally: null,
  for: null,
  function: null,
  if: null,
  import: null,
  in: null,
  instanceof: null,
  new: null,
  null: null,
  return: null,
  super: null,
  switch: null,
  this: null,
  throw: null,
  true: null,
  try: null,
  typeof: null,
  var: null,
  void: null,
  while: null,
  with: null,
};

export const STRICT_KEYWORD_RECORD = {
  yield: null,
  implements: null,
  interface: null,
  let: null,
  package: null,
  private: null,
  protected: null,
  public: null,
  static: null,
};

export const STRICT_READONLY_KEYWORD_RECORD = {
  arguments: null,
  eval: null,
};

// TODO: detect these
export const CONTEXTUAL_KEYWORD_RECORD = {
  yield: null, // generator function
  await: null, // asynchronous function
};

/** @type {Record<import("./estree").UnaryOperator, null>} */
export const UNARY_OPERATOR_RECORD = {
  "+": null,
  "-": null,
  "~": null,
  "!": null,
  "typeof": null,
  "void": null,
  "delete": null,
};

export const UNARY_OPERATOR_ENUM =
  /** @type {import("./estree").UnaryOperator[]} */ (
    listKey(UNARY_OPERATOR_RECORD)
  );

/** @type {(operator: string) => operator is import("./estree").UnaryOperator}  */
export const isUnaryOperator = (operator) =>
  hasNarrowKey(UNARY_OPERATOR_RECORD, operator);

/** @type {Record<import("./estree").BinaryOperator, null>} */
export const BINARY_OPERATOR_RECORD = {
  "==": null,
  "!=": null,
  "===": null,
  "!==": null,
  "<": null,
  "<=": null,
  ">": null,
  ">=": null,
  "<<": null,
  ">>": null,
  ">>>": null,
  "+": null,
  "-": null,
  "*": null,
  "/": null,
  "%": null,
  "|": null,
  "^": null,
  "&": null,
  "in": null,
  "instanceof": null,
  "**": null,
};

/** @type {Record<import("./estree").LogicalOperator, null>} */
export const LOGICAL_OPERATOR_RECORD = {
  "||": null,
  "&&": null,
  "??": null,
};

export const LOGICAL_ASSIGNMENT_OPERATOR_RECORD = {
  "||=": null,
  "&&=": null,
  "??=": null,
};

export const BINARY_OPERATOR_ENUM =
  /** @type {import("./estree").BinaryOperator[]} */ (
    listKey(BINARY_OPERATOR_RECORD)
  );

/** @type {(operator: string) => operator is import("./estree").BinaryOperator}  */
export const isBinaryOperator = (operator) =>
  hasNarrowKey(BINARY_OPERATOR_RECORD, operator);
