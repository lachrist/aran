import { drill } from "../site.mjs";
import { makeArrayExpression } from "../intrinsic.mjs";
import {
  makeApplyExpression,
  makeIntrinsicExpression,
  makePrimitiveExpression,
} from "../node.mjs";
import { unbuildExpression } from "./expression.mjs";

/**
 * @type {(
 *   site: {
 *     node: estree.Expression | estree.SpreadElement,
 *     path: unbuild.Path,
 *     meta: unbuild.Meta,
 *   },
 *   context: import("../context.js").Context,
 *   options: {},
 * ) => aran.Expression<unbuild.Atom>}
 */
export const unbuildSpreadable = ({ node, path, meta }, context, {}) => {
  switch (node.type) {
    case "SpreadElement": {
      const sites = drill({ node, path, meta }, ["argument"]);
      // Convertion to Array because:
      // Spread arguments do not use IsConcatSpreadable.
      // ((...xs) => xs)(...{0:"foo", length:1}) === ["foo"]
      return makeApplyExpression(
        makeIntrinsicExpression("Array.from", path),
        makePrimitiveExpression({ undefined: null }, path),
        [unbuildExpression(sites.argument, context, {})],
        path,
      );
    }
    default: {
      return makeArrayExpression(
        [unbuildExpression({ node, path, meta }, context, {})],
        path,
      );
    }
  }
};
