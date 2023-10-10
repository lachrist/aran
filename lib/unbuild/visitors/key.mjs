import { makePrimitiveExpression } from "../node.mjs";
import { DynamicError } from "../../util/error.mjs";
import { unbuildEffect } from "./effect.mjs";
import { unbuildExpression } from "./expression.mjs";
import { ANONYMOUS } from "../name.mjs";
import { wrapOrigin, wrapOriginArray } from "../origin.mjs";

/**
 * @type {(
 *   pair: {
 *     node: estree.Expression | estree.PrivateIdentifier,
 *     path: unbuild.Path,
 *   },
 *   context: import("../context.js").Context,
 *   options: { computed: boolean },
 * ) => aran.Expression<unbuild.Atom>}
 */
export const unbuildKeyExpression = wrapOrigin(
  ({ node, path }, context, { computed }) => {
    switch (node.type) {
      case "Identifier":
        return computed
          ? unbuildExpression({ node, path }, context, { name: ANONYMOUS })
          : makePrimitiveExpression(node.name);
      case "PrivateIdentifier":
        /** c8 ignore next 3 */
        if (computed) {
          throw new DynamicError("private key should not be computed", node);
        }
        return makePrimitiveExpression(node.name);
      default:
        return unbuildExpression({ node, path }, context, { name: ANONYMOUS });
    }
  },
);

/**
 * @type {(
 *   pair: {
 *     node: estree.Expression | estree.PrivateIdentifier,
 *     path: unbuild.Path,
 *   },
 *   context: import("../context.js").Context,
 *   options: { computed: boolean },
 * ) => aran.Effect<unbuild.Atom>[]}
 */
export const unbuildKeyEffect = wrapOriginArray(
  ({ node, path }, context, { computed }) => {
    if (computed) {
      if (node.type === "PrivateIdentifier") {
        throw new DynamicError("private key should not be computed", node);
      }
      return unbuildEffect({ node, path }, context, null);
    } else {
      return [];
    }
  },
);
