import { drillSite } from "../site.mjs";
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
 *   site: import("../site").Site<(
 *     import("../../estree").Expression | import("../../estree").SpreadElement
 *   )>,
 *   context: {
 *     scope: import("../scope").Scope,
 *     deadzone: import("../deadzone").Deadzone,
 *   },
 * ) => import("../../sequence").Sequence<
 *   import("../prelude").BodyPrelude,
 *   import("../atom").Expression,
 * >}
 */
export const unbuildSpreadable = (
  { node, path, meta },
  { scope, deadzone },
) => {
  if (node.type === "SpreadElement") {
    return incorporateExpression(
      mapSequence(
        callSequence_X_(
          cacheConstant,
          forkMeta((meta = nextMeta(meta))),
          unbuildExpression(
            drillSite(
              node,
              path,
              forkMeta((meta = nextMeta(meta))),
              "argument",
            ),
            { scope, deadzone },
          ),
          path,
        ),
        (iterator) =>
          makeConditionalExpression(
            makeBinaryExpression(
              "===",
              makeUnaryExpression(
                "typeof",
                makeGetExpression(
                  makeReadCacheExpression(iterator, path),
                  makeIntrinsicExpression("Symbol.iterator", path),
                  path,
                ),
                path,
              ),
              makePrimitiveExpression("function", path),
              path,
            ),
            makeApplyExpression(
              makeIntrinsicExpression("Array.from", path),
              makeIntrinsicExpression("undefined", path),
              [makeReadCacheExpression(iterator, path)],
              path,
            ),
            makeThrowErrorExpression(
              "TypeError",
              "Spread syntax requires iterable object",
              path,
            ),
            path,
          ),
      ),
      path,
    );
  } else {
    return liftSequenceX_(
      makeArrayExpression,
      liftSequenceX(
        concat_,
        unbuildExpression({ node, path, meta }, { scope, deadzone }),
      ),
      path,
    );
  }
};
