const {
  Reflect: { ownKeys: listKey },
} = globalThis;

/** @type {Record<string, null>} */
export const KEYWORD_RECORD = {
  await: null,
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
  yield: null,
};

export const STRICT_KEYWORD_RECORD = {
  await: null,
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

export const STRICT_READONLY_RECORD = {
  eval: null,
  arguments: null,
};

/** @type {Record<estree.UnaryOperator, null>} */
export const UNARY_OPERATOR_RECORD = {
  "+": null,
  "-": null,
  "~": null,
  "!": null,
  "typeof": null,
  "void": null,
  "delete": null,
};

export const UNARY_OPERATOR_ENUM = /** @type {estree.UnaryOperator[]} */ (
  listKey(UNARY_OPERATOR_RECORD)
);

/** @type {Record<estree.BinaryOperator, null>} */
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

export const BINARY_OPERATOR_ENUM = /** @type {estree.BinaryOperator[]} */ (
  listKey(BINARY_OPERATOR_RECORD)
);
