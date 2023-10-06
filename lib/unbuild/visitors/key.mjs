import { makePrimitiveExpression } from "../node.mjs";
import { DynamicError } from "../../util/error.mjs";
import { unbuildEffect } from "./effect.mjs";
import { unbuildExpression } from "./expression.mjs";
import { ANONYMOUS } from "../name.mjs";

/**
 * @type {<S>(
 *   pair: {
 *     node: estree.Expression | estree.PrivateIdentifier,
 *     path: unbuild.Path,
 *   },
 *   context: import("../context.js").Context<S>,
 *   options: { computed: boolean },
 * ) => aran.Expression<unbuild.Atom<S>>}
 */
export const unbuildKeyExpression = ({ node, path }, context, { computed }) => {
  const { serialize } = context;
  const serial = serialize(node, path);
  switch (node.type) {
    case "Identifier":
      return computed
        ? unbuildExpression({ node, path }, context, { name: ANONYMOUS })
        : makePrimitiveExpression(node.name, serial);
    case "PrivateIdentifier":
      /** c8 ignore next 3 */
      if (computed) {
        throw new DynamicError("private key should not be computed", node);
      }
      return makePrimitiveExpression(node.name, serial);
    default:
      return unbuildExpression({ node, path }, context, { name: ANONYMOUS });
  }
};

/**
 * @type {<S>(
 *   pair: {
 *     node: estree.Expression | estree.PrivateIdentifier,
 *     path: unbuild.Path,
 *   },
 *   context: import("../context.js").Context<S>,
 *   options: { computed: boolean },
 * ) => aran.Effect<unbuild.Atom<S>>[]}
 */
export const unbuildKeyEffect = ({ node, path }, context, { computed }) => {
  if (computed) {
    if (node.type === "PrivateIdentifier") {
      throw new DynamicError("private key should not be computed", node);
    }
    return unbuildEffect({ node, path }, context);
  } else {
    return [];
  }
};
