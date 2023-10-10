import { SyntaxAranError } from "../../error.mjs";
import { makeBinaryExpression } from "../intrinsic.mjs";
import { ANONYMOUS } from "../name.mjs";
import {
  makeConditionalExpression,
  makePrimitiveExpression,
  makeReadExpression,
} from "../node.mjs";
import { wrapOrigin } from "../origin.mjs";
import { unbuildExpression } from "./expression.mjs";

/**
 * @type {(
 *   pair: {
 *     node: estree.Expression,
 *     path: unbuild.Path,
 *   },
 *   context: import("../context.d.ts").Context,
 *   options: {
 *     left: unbuild.Variable,
 *     operator: estree.LogicalOperator,
 *   },
 * ) => aran.Expression<unbuild.Atom>}
 */
export const unbuildLogicalRight = wrapOrigin(
  ({ node, path }, context, { left, operator }) => {
    switch (operator) {
      case "&&":
        return makeConditionalExpression(
          makeReadExpression(left),
          unbuildExpression({ node, path }, context, {
            name: ANONYMOUS,
          }),
          makeReadExpression(left),
        );
      case "||":
        return makeConditionalExpression(
          makeReadExpression(left),
          makeReadExpression(left),
          unbuildExpression({ node, path }, context, {
            name: ANONYMOUS,
          }),
        );
      case "??":
        return makeConditionalExpression(
          makeBinaryExpression(
            "==",
            makeReadExpression(left),
            makePrimitiveExpression(null),
          ),
          unbuildExpression({ node, path }, context, {
            name: ANONYMOUS,
          }),
          makeReadExpression(left),
        );
      default:
        throw new SyntaxAranError("Invalid logical operator", node);
    }
  },
);
