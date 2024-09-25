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
import { forkMeta, nextMeta } from "../meta.mjs";
import {
  incorporateExpression,
  initSyntaxErrorExpression,
} from "../prelude/index.mjs";
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
} from "../../sequence.mjs";
import { cacheConstant, makeReadCacheExpression } from "../cache.mjs";
import { makePublicKeyExpression } from "../key.mjs";

const {
  Array: { of: toArray },
} = globalThis;

/**
 * @type {(
 *   node: import("../../estree").MemberExpression,
 * ) => node is import("../../estree").MemberExpression & {
 *   object: import("../../estree").Expression,
 * }}
 */
const isNotSuperMember = (node) => node.object.type !== "Super";

/**
 * @type {(
 *   node: import("../../estree").Expression,
 *   meta: import("../meta").Meta,
 *   context: import("../context").Context,
 * ) => import("../../sequence").Sequence<
 *   import("../prelude").BodyPrelude,
 *   import("../atom").Expression,
 * >}
 */
export const unbuildDeleteArgument = (
  node,
  meta,
  { digest, scope, annotation },
) => {
  const hash = digest(node);
  if (node.type === "ChainExpression") {
    return unbuildExpression(node.expression, meta, {
      digest,
      scope,
      annotation,
    });
  } else if (node.type === "MemberExpression") {
    const mode = getMode(scope);
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
            toArray,
            incorporateExpression(
              mapSequence(
                callSequence_X_(
                  cacheConstant,
                  forkMeta((meta = nextMeta(meta))),
                  unbuildExpression(
                    node.object,
                    forkMeta((meta = nextMeta(meta))),
                    { digest, scope, annotation },
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
              unbuildKey(node.property, forkMeta((meta = nextMeta(meta))), {
                digest,
                scope,
                annotation,
                computed: node.computed,
              }),
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
          toArray,
          liftSequenceX_(
            makeExpressionEffect,
            bindSequence(
              unbuildKey(node.property, forkMeta((meta = nextMeta(meta))), {
                digest,
                scope,
                annotation,
                computed: node.computed,
              }),
              (key) =>
                makePublicKeyExpression(hash, key, {
                  message: "Illegal private key in delete membmer",
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
    if (getMode(scope) === "strict") {
      return initSyntaxErrorExpression(
        "Cannot delete variable in strict mode",
        hash,
      );
    } else {
      return makeScopeLoadExpression(hash, meta, scope, {
        type: "discard",
        mode: getMode(scope),
        variable: /** @type {import("../../estree").Variable} */ (node.name),
      });
    }
  } else {
    return liftSequenceX__(
      makeSequenceExpression,
      unbuildEffect(node, meta, { digest, scope, annotation }),
      makePrimitiveExpression(true, hash),
      hash,
    );
  }
};
