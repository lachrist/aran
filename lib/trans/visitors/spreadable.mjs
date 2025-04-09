import {
  makeArrayExpression,
  makeBinaryExpression,
  makeGetExpression,
  makeThrowErrorExpression,
  makeUnaryExpression,
} from "../intrinsic.mjs";
import {
  makeApplyExpression,
  makeConditionalExpression,
  makeIntrinsicExpression,
  makePrimitiveExpression,
} from "../node.mjs";
import { transExpression } from "./expression.mjs";
import { cacheConstant, makeReadCacheExpression } from "../cache.mjs";
import { forkMeta, nextMeta } from "../meta.mjs";
import { incorporateExpression } from "../prelude/index.mjs";
import {
  concat_,
  callSequence_X_,
  liftSequenceX,
  liftSequenceX_,
  mapSequence,
} from "../../util/index.mjs";

/**
 * @type {(
 *   node: (
 *     | import("estree-sentry").Expression<import("../hash.d.ts").HashProp>
 *     | import("estree-sentry").SpreadElement<import("../hash.d.ts").HashProp>
 *   ),
 *   meta: import("../meta.d.ts").Meta,
 *   scope: import("../scope/index.d.ts").Scope,
 * ) => import("../../util/sequence.d.ts").Sequence<
 *   import("../prelude/index.d.ts").BodyPrelude,
 *   import("../atom.d.ts").Expression,
 * >}
 */
export const transSpreadable = (node, meta, scope) => {
  const { _hash: hash } = node;
  if (node.type === "SpreadElement") {
    return incorporateExpression(
      mapSequence(
        callSequence_X_(
          cacheConstant,
          forkMeta((meta = nextMeta(meta))),
          transExpression(node.argument, meta, scope),
          hash,
        ),
        (iterator) =>
          makeConditionalExpression(
            makeBinaryExpression(
              "===",
              makeUnaryExpression(
                "typeof",
                makeGetExpression(
                  makeReadCacheExpression(iterator, hash),
                  makeIntrinsicExpression("Symbol.iterator", hash),
                  hash,
                ),
                hash,
              ),
              makePrimitiveExpression("function", hash),
              hash,
            ),
            makeApplyExpression(
              makeIntrinsicExpression("Array.from", hash),
              makeIntrinsicExpression("undefined", hash),
              [makeReadCacheExpression(iterator, hash)],
              hash,
            ),
            makeThrowErrorExpression(
              "TypeError",
              "Spread syntax requires iterable object",
              hash,
            ),
            hash,
          ),
      ),
      hash,
    );
  } else {
    return liftSequenceX_(
      makeArrayExpression,
      liftSequenceX(concat_, transExpression(node, meta, scope)),
      hash,
    );
  }
};
