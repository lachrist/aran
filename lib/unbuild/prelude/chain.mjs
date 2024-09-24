import { AranTypeError } from "../../report.mjs";
import { filterNarrow, reduceReverse } from "../../util/index.mjs";
import { makeConditionalExpression, makeSequenceExpression } from "../node.mjs";
import { isBodyPrelude, isChainPrelude } from "./prelude.mjs";
import {
  filterSequence,
  listenSequence,
  mapSequence,
} from "../../sequence.mjs";

/**
 * @type {(
 *   node: import("../atom").Expression,
 *   prelude: (
 *     | import(".").PrefixPrelude
 *     | import(".").ConditionPrelude
 *   ),
 *   hash: import("../../hash").Hash,
 * ) => import("../atom").Expression}
 */
const reduceChain = (node, prelude, hash) => {
  switch (prelude.type) {
    case "prefix": {
      return makeSequenceExpression([prelude.data], node, hash);
    }
    case "condition": {
      return makeConditionalExpression(
        prelude.data.test,
        prelude.data.exit,
        node,
        hash,
      );
    }
    default: {
      throw new AranTypeError(prelude);
    }
  }
};

/**
 * @type {<P extends import(".").BodyPrelude>(
 *   chain: import("../../sequence").Sequence<
 *     (
 *       | P
 *       | import(".").PrefixPrelude
 *       | import(".").ConditionPrelude
 *     ),
 *     import("../atom").Expression,
 *   >,
 *   hash: import("../../hash").Hash,
 * ) => import("../../sequence").Sequence<
 *   P,
 *   import("../atom").Expression,
 * >}
 */
export const resolveChain = (sequence, hash) =>
  mapSequence(filterSequence(sequence, isBodyPrelude), (node) =>
    reduceReverse(
      filterNarrow(listenSequence(sequence), isChainPrelude),
      (node, prelude) => reduceChain(node, prelude, hash),
      node,
    ),
  );
