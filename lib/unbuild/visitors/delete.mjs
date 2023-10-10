import { drill } from "../../drill.mjs";
import {
  makeDeleteExpression,
  makeLongSequenceExpression,
  makeThrowErrorExpression,
} from "../intrinsic.mjs";
import { ANONYMOUS } from "../name.mjs";
import { makePrimitiveExpression } from "../node.mjs";
import { wrapOrigin } from "../origin.mjs";
import { isNotSuperMemberExpression } from "../predicate.mjs";
import { makeScopeDiscardExpression } from "../scope/index.mjs";
import { unbuildEffect } from "./effect.mjs";
import { unbuildExpression } from "./expression.mjs";
import { unbuildKeyEffect, unbuildKeyExpression } from "./key.mjs";

/**
 * @type {(
 *   pair: {
 *     node: estree.Expression,
 *     path: unbuild.Path,
 *   },
 *   context: import("../context.d.ts").Context,
 *   options: null,
 * ) => aran.Expression<unbuild.Atom>}
 */
export const unbuildDeleteArgument = wrapOrigin(({ node, path }, context) => {
  switch (node.type) {
    case "ChainExpression":
      return unbuildDeleteArgument(
        drill({ node, path }, "expression"),
        context,
        null,
      );
    case "MemberExpression":
      if (isNotSuperMemberExpression(node)) {
        return makeDeleteExpression(
          context.strict,
          unbuildExpression(drill({ node, path }, "object"), context, {
            name: ANONYMOUS,
          }),
          unbuildKeyExpression(
            drill({ node, path }, "property"),
            context,
            node,
          ),
        );
      } else {
        return makeLongSequenceExpression(
          unbuildKeyEffect(drill({ node, path }, "property"), context, node),
          makeThrowErrorExpression(
            "ReferenceError",
            "Unsupported reference to 'super'",
          ),
        );
      }
    case "Identifier":
      return makeScopeDiscardExpression(
        context,
        /** @type {estree.Variable} */ (node.name),
      );
    default:
      return makeLongSequenceExpression(
        unbuildEffect({ node, path }, context, null),
        makePrimitiveExpression(true),
      );
  }
});
