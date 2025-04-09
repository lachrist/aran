import {
  everyNarrow,
  map,
  flatSequence,
  liftSequenceX,
  liftSequence__X_,
} from "../../util/index.mjs";
import {
  makeConcatArgumentList,
  makeSpreadArgumentList,
} from "../arguments.mjs";
import { makeArrayExpression } from "../intrinsic.mjs";
import { forkMeta, nextMeta } from "../meta.mjs";
import { makeApplyExpression, makeIntrinsicExpression } from "../node.mjs";
import { transExpression } from "./expression.mjs";
import { transSpreadable } from "./spreadable.mjs";

/**
 * @type {(
 *   node: import("estree-sentry").Expression<import("../hash.d.ts").HashProp> | import("estree-sentry").SpreadElement<import("../hash.d.ts").HashProp>,
 * ) => node is import("estree-sentry").Expression<import("../hash.d.ts").HashProp>}
 */
const isNotSpreadElement = (node) => node.type !== "SpreadElement";

/**
 * @type {(
 *   nodes: (
 *     | import("estree-sentry").Expression<import("../hash.d.ts").HashProp>
 *     | import("estree-sentry").SpreadElement<import("../hash.d.ts").HashProp>
 *   )[],
 *   meta: import("../meta.d.ts").Meta,
 *   scope: import("../scope/index.d.ts").Scope,
 *   hash: import("../hash.d.ts").Hash,
 * ) => import("../../util/sequence.d.ts").Sequence<
 *   import("../prelude/index.d.ts").BodyPrelude,
 *   import("../argument.d.ts").ArgumentList
 * >}
 */
export const transArgumentList = (nodes, meta, scope, hash) => {
  if (everyNarrow(nodes, isNotSpreadElement)) {
    return liftSequenceX(
      makeSpreadArgumentList,
      flatSequence(
        map(nodes, (node) =>
          transExpression(node, forkMeta((meta = nextMeta(meta))), scope),
        ),
      ),
    );
  } else {
    return liftSequenceX(
      makeConcatArgumentList,
      liftSequence__X_(
        makeApplyExpression,
        makeIntrinsicExpression("Array.prototype.concat", hash),
        makeArrayExpression([], hash),
        flatSequence(
          map(nodes, (node) =>
            transSpreadable(node, forkMeta((meta = nextMeta(meta))), scope),
          ),
        ),
        hash,
      ),
    );
  }
};
