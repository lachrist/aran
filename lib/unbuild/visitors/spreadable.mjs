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
import { unbuildExpression } from "./expression.mjs";
import { cacheConstant, makeReadCacheExpression } from "../cache.mjs";
import {
  callSequence_X_,
  liftSequenceX,
  liftSequenceX_,
  mapSequence,
} from "../../sequence.mjs";
import { forkMeta, nextMeta } from "../meta.mjs";
import { incorporateExpression } from "../prelude/index.mjs";
import { concat_ } from "../../util/index.mjs";

/**
 * @type {(
 *   node: (
 *     | import("estree-sentry").Expression<import("../../hash").HashProp>
 *     | import("estree-sentry").SpreadElement<import("../../hash").HashProp>
 *   ),
 *   meta: import("../meta").Meta,
 *   scope: import("../scope").Scope,
 * ) => import("../../sequence").Sequence<
 *   import("../prelude").BodyPrelude,
 *   import("../atom").Expression,
 * >}
 */
export const unbuildSpreadable = (node, meta, scope) => {
  const { _hash: hash } = node;
  if (node.type === "SpreadElement") {
    return incorporateExpression(
      mapSequence(
        callSequence_X_(
          cacheConstant,
          forkMeta((meta = nextMeta(meta))),
          unbuildExpression(node.argument, meta, scope),
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
      liftSequenceX(concat_, unbuildExpression(node, meta, scope)),
      hash,
    );
  }
};
