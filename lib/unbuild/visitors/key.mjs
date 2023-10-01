import { makePrimitiveExpression } from "../node.mjs";
import { DynamicError } from "../../util/error.mjs";
import { unbuildEffect } from "./effect.mjs";
import { unbuildExpression } from "./expression.mjs";
import { ANONYMOUS } from "../name.mjs";
import { getPath } from "../annotate.mjs";

/**
 * @type {<S>(
 *   node: estree.Expression | estree.PrivateIdentifier,
 *   context: import("../context.js").Context<S>,
 *   options: { computed: boolean },
 * ) => aran.Expression<unbuild.Atom<S>>}
 */
export const unbuildKeyExpression = (node, context, { computed }) => {
  const { serialize } = context;
  const serial = serialize(node, context.root, getPath(node));
  switch (node.type) {
    case "Identifier":
      return computed
        ? unbuildExpression(node, context, { name: ANONYMOUS })
        : makePrimitiveExpression(node.name, serial);
    case "PrivateIdentifier":
      /** c8 ignore next 3 */
      if (computed) {
        throw new DynamicError("private key should not be computed", node);
      }
      return makePrimitiveExpression(node.name, serial);
    default:
      return unbuildExpression(node, context, { name: ANONYMOUS });
  }
};

/**
 * @type {<S>(
 *   node: estree.Expression | estree.PrivateIdentifier,
 *   context: import("../context.js").Context<S>,
 *   options: { computed: boolean },
 * ) => aran.Effect<unbuild.Atom<S>>[]}
 */
export const unbuildKeyEffect = (node, context, { computed }) => {
  if (computed) {
    if (node.type === "PrivateIdentifier") {
      throw new DynamicError("private key should not be computed", node);
    }
    return unbuildEffect(node, context);
  } else {
    return [];
  }
};
