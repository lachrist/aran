import {
  makeBinaryExpression,
  makeThrowErrorExpression,
} from "../intrinsic.mjs";
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
import { unbuildKey } from "./key.mjs";
import { guard } from "../../util/index.mjs";
import { drillSite } from "../site.mjs";
import { forkMeta, nextMeta } from "../meta.mjs";
import { makeEarlyErrorExpression } from "../early-error.mjs";
import {
  bindSequence,
  callSequence_X_,
  liftSequenceX,
  liftSequenceXX,
  liftSequenceX_,
  liftSequenceX__,
  liftSequenceX___,
  liftSequence__X_,
  mapSequence,
} from "../sequence.mjs";
import { cacheConstant, makeReadCacheExpression } from "../cache.mjs";
import { makePublicKeyExpression } from "../key.mjs";
import { cleanupExpression } from "../cleanup.mjs";

const {
  Array: { of: toArray },
} = globalThis;

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
 * ) => import("../sequence").Sequence<
 *   import("../prelude").BodyPrelude,
 *   aran.Expression<unbuild.Atom>,
 * >}
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
          liftSequenceX___(
            makeConditionalExpression,
            node,
            makePrimitiveExpression(true, path),
            makeThrowErrorExpression(
              "TypeError",
              "Cannot delete property",
              path,
            ),
            path,
          ),
        liftSequence__X_(
          makeApplyExpression,
          makeIntrinsicExpression("Reflect.deleteProperty", path),
          makePrimitiveExpression({ undefined: null }, path),
          liftSequenceXX(
            toArray,
            cleanupExpression(
              mapSequence(
                callSequence_X_(
                  cacheConstant,
                  forkMeta((meta = nextMeta(meta))),
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
                  path,
                ),
                (cache) =>
                  makeConditionalExpression(
                    makeBinaryExpression(
                      "==",
                      makeReadCacheExpression(cache, path),
                      makePrimitiveExpression(null, path),
                      path,
                    ),
                    makeReadCacheExpression(cache, path),
                    makeApplyExpression(
                      makeIntrinsicExpression("Object", path),
                      makePrimitiveExpression({ undefined: null }, path),
                      [makeReadCacheExpression(cache, path)],
                      path,
                    ),
                    path,
                  ),
              ),
              path,
            ),
            cleanupExpression(
              bindSequence(
                unbuildKey(
                  drillSite(
                    node,
                    path,
                    forkMeta((meta = nextMeta(meta))),
                    "property",
                  ),
                  scope,
                  { computed: node.computed },
                ),
                (key) =>
                  makePublicKeyExpression({ path }, key, {
                    message: "Illegal private key in delete membmer",
                  }),
              ),
              path,
            ),
          ),
          path,
        ),
      );
    } else {
      return liftSequenceX__(
        makeSequenceExpression,
        liftSequenceX(
          toArray,
          liftSequenceX_(
            makeExpressionEffect,
            cleanupExpression(
              bindSequence(
                unbuildKey(
                  drillSite(
                    node,
                    path,
                    forkMeta((meta = nextMeta(meta))),
                    "property",
                  ),
                  scope,
                  { computed: node.computed },
                ),
                (key) =>
                  makePublicKeyExpression({ path }, key, {
                    message: "Illegal private key in delete membmer",
                  }),
              ),
              path,
            ),
            path,
          ),
        ),
        makeThrowErrorExpression(
          "ReferenceError",
          "Cannot delete 'super' property",
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
    return liftSequenceX__(
      makeSequenceExpression,
      unbuildEffect({ node, path, meta }, scope, null),
      makePrimitiveExpression(true, path),
      path,
    );
  }
};
