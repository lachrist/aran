import { makePrimitiveExpression } from "../../node.mjs";
import { DynamicError } from "../../util/error.mjs";
import { deconstructEffect } from "./effect.mjs";

import { deconstructExpression } from "./expression.mjs";

/**
 * @type {<S>(
 *   node: estree.Expression | estree.PrivateIdentifier,
 *   context: import("./context.js").Context<S>,
 *   computed: boolean,
 * ) => Expression<S>}
 */
export const deconstructKeyExpression = (node, context, computed) => {
  const serial = context.serialize(node);
  switch (node.type) {
    case "Identifier":
      return computed
        ? deconstructExpression(node, context, null)
        : makePrimitiveExpression(node.name, serial);
    case "PrivateIdentifier":
      /** c8 ignore next 3 */
      if (computed) {
        throw new DynamicError("private key should not be computed", node);
      }
      return makePrimitiveExpression(node.name, serial);
    default:
      return deconstructExpression(node, context, null);
  }
};

/**
 * @type {<S>(
 *   node: estree.Expression | estree.PrivateIdentifier,
 *   context: import("./context.js").Context<S>,
 *   computed: boolean,
 * ) => Effect<S>[]}
 */
export const deconstructKeyEffect = (node, context, computed) => {
  if (computed) {
    if (node.type === "PrivateIdentifier") {
      throw new DynamicError("private key should not be computed", node);
    }
    return deconstructEffect(node, context);
  } else {
    return [];
  }
};
