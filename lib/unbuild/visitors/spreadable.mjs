import { drill } from "../../drill.mjs";
import { makeArrayExpression } from "../intrinsic.mjs";
import { ANONYMOUS } from "../name.mjs";
import { wrapOrigin } from "../origin.mjs";
import { unbuildExpression } from "./expression.mjs";

/**
 * @type {(
 *   pair: {
 *     node: estree.Expression | estree.SpreadElement,
 *     path: unbuild.Path,
 *   },
 *   context: import("../context.js").Context,
 *   options: null,
 * ) => aran.Expression<unbuild.Atom>}
 */
export const unbuildSpreadable = wrapOrigin(({ node, path }, context) => {
  switch (node.type) {
    case "SpreadElement":
      return unbuildExpression(drill({ node, path }, "argument"), context, {
        name: ANONYMOUS,
      });
    default:
      return makeArrayExpression([
        unbuildExpression({ node, path }, context, {
          name: ANONYMOUS,
        }),
      ]);
  }
});
