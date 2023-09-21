import { makeArrayExpression } from "../intrinsic.mjs";
import { unbuildExpression } from "./expression.mjs";

/**
 * @type {<S>(
 *   node: estree.Expression | estree.SpreadElement,
 *   context: import("./context.js").Context<S>,
 *   options: {},
 * ) => aran.Expression<unbuild.Atom<S>>}
 */
export const unbuildSpreadable = (node, context, {}) => {
  const { serialize } = context;
  const serial = serialize(node);
  switch (node.type) {
    case "SpreadElement":
      return unbuildExpression(node.argument, context, null);
    default:
      return makeArrayExpression(
        [unbuildExpression(node, context, null)],
        serial,
      );
  }
};
