import {
  makeBinaryExpression,
  makeThrowErrorExpression,
} from "../intrinsic.mjs";
import {
  listExpressionEffect,
  makeApplyExpression,
  makeConditionalExpression,
  makeIntrinsicExpression,
  makePrimitiveExpression,
  makeSequenceExpression,
} from "../node.mjs";
import { unbuildEffect } from "./effect.mjs";
import { unbuildExpression } from "./expression.mjs";
import { unbuildKey } from "./key.mjs";
import {
  concat_,
  flatenTree,
  guard,
  bindSequence,
  callSequence_X_,
  liftSequenceX,
  liftSequenceXX,
  liftSequenceX_,
  liftSequenceX__,
  liftSequenceX___,
  liftSequence__X_,
  mapSequence,
} from "../../util/index.mjs";
import { forkMeta, nextMeta } from "../meta.mjs";
import { cacheConstant, makeReadCacheExpression } from "../cache.mjs";
import { makePublicKeyExpression } from "../key.mjs";
import { makeDiscardVariableExpression } from "../scope/index.mjs";
import {
  incorporateExpression,
  initSyntaxErrorExpression,
} from "../prelude/index.mjs";

/**
 * @type {(
 *   node: import("estree-sentry").MemberExpression<import("../../hash").HashProp>,
 * ) => node is import("estree-sentry").MemberExpression<import("../../hash").HashProp> & {
 *   object: import("estree-sentry").Expression<import("../../hash").HashProp>,
 * }}
 */
const isNotSuperMember = (node) => node.object.type !== "Super";

/**
 * @type {(
 *   node: import("estree-sentry").Expression<import("../../hash").HashProp>,
 *   meta: import("../meta").Meta,
 *   scope: import("../scope").Scope,
 * ) => import("../../util/sequence").Sequence<
 *   import("../prelude").BodyPrelude,
 *   import("../atom").Expression,
 * >}
 */
export const unbuildDeleteArgument = (node, meta, scope) => {
  const { _hash: hash } = node;
  if (node.type === "ChainExpression") {
    return unbuildExpression(node, meta, scope);
  } else if (node.type === "MemberExpression") {
    const mode = scope.mode;
    if (isNotSuperMember(node)) {
      return guard(
        mode === "strict",
        (node) =>
          liftSequenceX___(
            makeConditionalExpression,
            node,
            makePrimitiveExpression(true, hash),
            makeThrowErrorExpression(
              "TypeError",
              "Cannot delete property",
              hash,
            ),
            hash,
          ),
        liftSequence__X_(
          makeApplyExpression,
          makeIntrinsicExpression("Reflect.deleteProperty", hash),
          makeIntrinsicExpression("undefined", hash),
          liftSequenceXX(
            concat_,
            incorporateExpression(
              mapSequence(
                callSequence_X_(
                  cacheConstant,
                  forkMeta((meta = nextMeta(meta))),
                  unbuildExpression(
                    node.object,
                    forkMeta((meta = nextMeta(meta))),
                    scope,
                  ),
                  hash,
                ),
                (cache) =>
                  makeConditionalExpression(
                    makeBinaryExpression(
                      "==",
                      makeReadCacheExpression(cache, hash),
                      makePrimitiveExpression(null, hash),
                      hash,
                    ),
                    makeReadCacheExpression(cache, hash),
                    makeApplyExpression(
                      makeIntrinsicExpression("Object", hash),
                      makeIntrinsicExpression("undefined", hash),
                      [makeReadCacheExpression(cache, hash)],
                      hash,
                    ),
                    hash,
                  ),
              ),
              hash,
            ),
            bindSequence(
              unbuildKey(
                node.property,
                forkMeta((meta = nextMeta(meta))),
                scope,
                node.computed,
              ),
              (key) =>
                makePublicKeyExpression(hash, key, {
                  message: "Illegal private key in delete membmer",
                }),
            ),
          ),
          hash,
        ),
      );
    } else {
      return liftSequenceX__(
        makeSequenceExpression,
        liftSequenceX(
          flatenTree,
          liftSequenceX_(
            listExpressionEffect,
            bindSequence(
              unbuildKey(
                node.property,
                forkMeta((meta = nextMeta(meta))),
                scope,
                node.computed,
              ),
              (key) =>
                makePublicKeyExpression(hash, key, {
                  message: "Illegal private key in delete member",
                }),
            ),
            hash,
          ),
        ),
        makeThrowErrorExpression(
          "ReferenceError",
          "Cannot delete 'super' property",
          hash,
        ),
        hash,
      );
    }
  } else if (node.type === "Identifier") {
    if (scope.mode === "strict") {
      return initSyntaxErrorExpression(
        "Cannot delete variable in strict mode",
        hash,
      );
    } else {
      return makeDiscardVariableExpression(hash, meta, scope, {
        variable: node.name,
      });
    }
  } else {
    return liftSequenceX__(
      makeSequenceExpression,
      liftSequenceX(flatenTree, unbuildEffect(node, meta, scope)),
      makePrimitiveExpression(true, hash),
      hash,
    );
  }
};
