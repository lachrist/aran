import { drill } from "../../drill.mjs";
import {
  makeDeleteExpression,
  makeLongSequenceExpression,
  makeThrowErrorExpression,
} from "../intrinsic.mjs";
import { splitMeta } from "../mangle.mjs";
import { ANONYMOUS } from "../name.mjs";
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
 *   pair: {
 *     node: estree.Expression,
 *     path: unbuild.Path,
 *   },
 *   context: import("../context.d.ts").Context,
 *   options: {
 *     meta: unbuild.Meta,
 *   },
 * ) => aran.Expression<unbuild.Atom>}
 */
export const unbuildDeleteArgument = ({ node, path }, context, { meta }) => {
  switch (node.type) {
    case "ChainExpression": {
      return unbuildDeleteArgument(
        drill({ node, path }, "expression"),
        context,
        { meta },
      );
    }
    case "MemberExpression": {
      if (isNotSuperMemberExpression(node)) {
        const metas = splitMeta(meta, ["object", "property"]);
        return makeDeleteExpression(
          context.strict,
          unbuildExpression(drill({ node, path }, "object"), context, {
            meta: metas.object,
            name: ANONYMOUS,
          }),
          unbuildKeyExpression(drill({ node, path }, "property"), context, {
            meta: metas.property,
            computed: node.computed,
          }),
          path,
        );
      } else {
        return makeSequenceExpression(
          makeExpressionEffect(
            unbuildKeyExpression(drill({ node, path }, "property"), context, {
              computed: node.computed,
              meta,
            }),
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
        unbuildEffect({ node, path }, context, { meta }),
        makePrimitiveExpression(true, path),
        path,
      );
    }
  }
};
