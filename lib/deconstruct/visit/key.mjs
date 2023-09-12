import { makePrimitiveExpression } from "../../node.mjs";
import { DynamicError } from "../../util/error.mjs";

import { deconstructExpression } from "./expression.mjs";

/**
 * @type {<S>(
 *   node: estree.Expression | estree.PrivateIdentifier,
 *   context: import("./context.d.ts").Context<S>,
 *   computed: boolean,
 * ) => Expression<S>}
 */
export const deconstructKey = (node, context, computed) => {
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
