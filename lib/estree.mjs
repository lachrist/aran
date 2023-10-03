const {
  Reflect: { ownKeys: listKey },
} = globalThis;

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
