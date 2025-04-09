import { AranTypeError } from "../../error.mjs";
import {
  filterNarrowTree,
  reduceReverse,
  filterSequence,
  listenSequence,
  mapSequence,
} from "../../util/index.mjs";
import { makeConditionalExpression, makeSequenceExpression } from "../node.mjs";
import { isBodyPrelude, isChainPrelude } from "./prelude.mjs";

/**
 * @type {(
 *   node: import("../atom.d.ts").Expression,
 *   prelude: (
 *     | import("./index.d.ts").PrefixPrelude
 *     | import("./index.d.ts").ConditionPrelude
 *   ),
 *   hash: import("../hash.d.ts").Hash,
 * ) => import("../atom.d.ts").Expression}
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
 * @type {<P extends import("./index.d.ts").BodyPrelude>(
 *   chain: import("../../util/sequence.d.ts").Sequence<
 *     (
 *       | P
 *       | import("./index.d.ts").PrefixPrelude
 *       | import("./index.d.ts").ConditionPrelude
 *     ),
 *     import("../atom.d.ts").Expression,
 *   >,
 *   hash: import("../hash.d.ts").Hash,
 * ) => import("../../util/sequence.d.ts").Sequence<
 *   P,
 *   import("../atom.d.ts").Expression,
 * >}
 */
export const resolveChain = (sequence, hash) =>
  mapSequence(filterSequence(sequence, isBodyPrelude), (node) =>
    reduceReverse(
      filterNarrowTree(listenSequence(sequence), isChainPrelude),
      (node, prelude) => reduceChain(node, prelude, hash),
      node,
    ),
  );
