import { drill } from "../../drill.mjs";
import { makeArrayExpression } from "../intrinsic.mjs";
import { ANONYMOUS } from "../name.mjs";
import {
  makeApplyExpression,
  makeIntrinsicExpression,
  makePrimitiveExpression,
} from "../node.mjs";
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
export const unbuildSpreadable = ({ node, path }, context) => {
  switch (node.type) {
    case "SpreadElement": {
      // Convertion to Array because:
      // Spread arguments do not use IsConcatSpreadable.
      // ((...xs) => xs)(...{0:"foo", length:1}) === ["foo"]
      return makeApplyExpression(
        makeIntrinsicExpression("Array.from", path),
        makePrimitiveExpression({ undefined: null }, path),
        [
          unbuildExpression(drill({ node, path }, "argument"), context, {
            name: ANONYMOUS,
          }),
        ],
        path,
      );
    }
    default: {
      return makeArrayExpression(
        [
          unbuildExpression({ node, path }, context, {
            name: ANONYMOUS,
          }),
        ],
        path,
      );
    }
  }
};
