import { drill } from "../../drill.mjs";
import { makeArrayExpression } from "../intrinsic.mjs";
import { ANONYMOUS } from "../name.mjs";
import { unbuildExpression } from "./expression.mjs";

/**
 * @type {<S>(
 *   pair: {
 *     node: estree.Expression | estree.SpreadElement,
 *     path: unbuild.Path,
 *   },
 *   context: import("../context.js").Context<S>,
 * ) => aran.Expression<unbuild.Atom<S>>}
 */
export const unbuildSpreadable = ({ node, path }, context) => {
  const { serialize } = context;
  const serial = serialize(node, path);
  switch (node.type) {
    case "SpreadElement":
      return unbuildExpression(drill({ node, path }, "argument"), context, {
        name: ANONYMOUS,
      });
    default:
      return makeArrayExpression(
        [
          unbuildExpression({ node, path }, context, {
            name: ANONYMOUS,
          }),
        ],
        serial,
      );
  }
};
