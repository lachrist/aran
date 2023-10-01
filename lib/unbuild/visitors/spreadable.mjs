import { getPath } from "../annotate.mjs";
import { makeArrayExpression } from "../intrinsic.mjs";
import { ANONYMOUS } from "../name.mjs";
import { unbuildExpression } from "./expression.mjs";

/**
 * @type {<S>(
 *   node: estree.Expression | estree.SpreadElement,
 *   context: import("../context.js").Context<S>,
 * ) => aran.Expression<unbuild.Atom<S>>}
 */
export const unbuildSpreadable = (node, context) => {
  const { serialize } = context;
  const serial = serialize(node, context.root, getPath(node));
  switch (node.type) {
    case "SpreadElement":
      return unbuildExpression(node.argument, context, { name: ANONYMOUS });
    default:
      return makeArrayExpression(
        [unbuildExpression(node, context, { name: ANONYMOUS })],
        serial,
      );
  }
};
