import { drill } from "../site.mjs";
import {
  makeDeleteExpression,
  makeLongSequenceExpression,
  makeThrowErrorExpression,
} from "../intrinsic.mjs";
import {
  makeExpressionEffect,
  makePrimitiveExpression,
  makeSequenceExpression,
} from "../node.mjs";
import { isNotSuperMemberExpression } from "../predicate.mjs";
import { makeScopeDiscardExpression } from "../scope/index.mjs";
import { unbuildEffect } from "./effect.mjs";
import { unbuildExpression } from "./expression.mjs";
import { unbuildKeyExpression } from "./key.mjs";

/**
 * @type {(
 *   site: import("../site.mjs").Site<estree.Expression>,
 *   context: import("../context.d.ts").Context,
 *   options: {},
 * ) => aran.Expression<unbuild.Atom>}
 */
export const unbuildDeleteArgument = ({ node, path, meta }, context, {}) => {
  switch (node.type) {
    case "ChainExpression": {
      const sites = drill({ node, path, meta }, ["expression"]);
      return unbuildDeleteArgument(sites.expression, context, { meta });
    }
    case "MemberExpression": {
      const { computed } = node;
      if (isNotSuperMemberExpression(node)) {
        const sites = drill({ node, path, meta }, ["object", "property"]);
        return makeDeleteExpression(
          context.strict,
          unbuildExpression(sites.object, context, {}),
          unbuildKeyExpression(sites.property, context, { computed }),
          path,
        );
      } else {
        const sites = drill({ node, path, meta }, ["property"]);
        return makeSequenceExpression(
          makeExpressionEffect(
            unbuildKeyExpression(sites.property, context, { computed }),
            path,
          ),
          makeThrowErrorExpression(
            "ReferenceError",
            "Unsupported reference to 'super'",
            path,
          ),
          path,
        );
      }
    }
    case "Identifier": {
      return makeScopeDiscardExpression(
        context,
        /** @type {estree.Variable} */ (node.name),
        path,
      );
    }
    default: {
      return makeLongSequenceExpression(
        unbuildEffect({ node, path, meta }, context, { meta }),
        makePrimitiveExpression(true, path),
        path,
      );
    }
  }
};
