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
import { transEffect } from "./effect.mjs";
import { transExpression } from "./expression.mjs";
import { transKey } from "./key.mjs";
import {
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
  concat__,
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
 *   node: import("estree-sentry").MemberExpression<import("../hash.d.ts").HashProp>,
 * ) => node is import("estree-sentry").MemberExpression<import("../hash.d.ts").HashProp> & {
 *   object: import("estree-sentry").Expression<import("../hash.d.ts").HashProp>,
 * }}
 */
const isNotSuperMember = (node) => node.object.type !== "Super";

/**
 * @type {(
 *   node: import("estree-sentry").Expression<import("../hash.d.ts").HashProp>,
 *   meta: import("../meta.d.ts").Meta,
 *   scope: import("../scope/index.d.ts").Scope,
 * ) => import("../../util/sequence.d.ts").Sequence<
 *   import("../prelude/index.d.ts").BodyPrelude,
 *   import("../atom.d.ts").Expression,
 * >}
 */
export const transDeleteArgument = (node, meta, scope) => {
  const { _hash: hash } = node;
  if (node.type === "ChainExpression") {
    return transExpression(node, meta, scope);
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
            concat__,
            incorporateExpression(
              mapSequence(
                callSequence_X_(
                  cacheConstant,
                  forkMeta((meta = nextMeta(meta))),
                  transExpression(
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
              transKey(
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
              transKey(
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
      liftSequenceX(flatenTree, transEffect(node, meta, scope)),
      makePrimitiveExpression(true, hash),
      hash,
    );
  }
};
