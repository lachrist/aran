import { makeThrowErrorExpression } from "../intrinsic.mjs";
import {
  makeApplyExpression,
  makeConditionalExpression,
  makeExpressionEffect,
  makeIntrinsicExpression,
  makePrimitiveExpression,
  makeSequenceExpression,
} from "../node.mjs";
import { getMode, makeScopeLoadExpression } from "../scope/index.mjs";
import { unbuildEffect } from "./effect.mjs";
import { unbuildExpression } from "./expression.mjs";
import { unbuildKeyExpression } from "./key.mjs";
import { guard } from "../../util/index.mjs";
import { drillSite } from "../site.mjs";
import { forkMeta, nextMeta } from "../meta.mjs";
import { makeEarlyErrorExpression } from "../early-error.mjs";

/**
 * @type {(
 *   node: estree.MemberExpression,
 * ) => node is estree.MemberExpression & {
 *   object: estree.Expression,
 * }}
 */
const isNotSuperMember = (node) => node.object.type !== "Super";

/**
 * @type {(
 *   site: import("../site").Site<estree.Expression>,
 *   scope: import("../scope").Scope,
 *   options: null,
 * ) => import("../sequence").ExpressionSequence}
 */
export const unbuildDeleteArgument = (
  { node, path, meta },
  scope,
  _options,
) => {
  if (node.type === "ChainExpression") {
    return unbuildExpression(
      drillSite(node, path, meta, "expression"),
      scope,
      null,
    );
  } else if (node.type === "MemberExpression") {
    const mode = getMode(scope);
    if (isNotSuperMember(node)) {
      return guard(
        mode === "strict",
        (node) =>
          makeConditionalExpression(
            node,
            makePrimitiveExpression(true, path),
            makeThrowErrorExpression(
              "TypeError",
              "Cannot delete property",
              path,
            ),
            path,
          ),
        makeApplyExpression(
          makeIntrinsicExpression("Reflect.deleteProperty", path),
          makePrimitiveExpression({ undefined: null }, path),
          [
            unbuildExpression(
              drillSite(
                node,
                path,
                forkMeta((meta = nextMeta(meta))),
                "object",
              ),
              scope,
              null,
            ),
            unbuildKeyExpression(
              drillSite(
                node,
                path,
                forkMeta((meta = nextMeta(meta))),
                "property",
              ),
              scope,
              { computed: node.computed, eager_cooking: false },
            ),
          ],
          path,
        ),
      );
    } else {
      return makeSequenceExpression(
        makeExpressionEffect(
          unbuildKeyExpression(drillSite(node, path, meta, "property"), scope, {
            computed: node.computed,
            eager_cooking: true,
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
  } else if (node.type === "Identifier") {
    if (getMode(scope) === "strict") {
      return makeEarlyErrorExpression(
        "Cannot delete variable in strict mode",
        path,
      );
    } else {
      return makeScopeLoadExpression({ path, meta }, scope, {
        type: "discard",
        mode: getMode(scope),
        variable: /** @type {estree.Variable} */ (node.name),
      });
    }
  } else {
    return makeSequenceExpression(
      unbuildEffect({ node, path, meta }, scope, null),
      makePrimitiveExpression(true, path),
      path,
    );
  }
};
