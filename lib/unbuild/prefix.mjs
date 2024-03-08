import { AranTypeError } from "../error.mjs";
import {
  compileGet,
  filterNarrow,
  map,
  reduceReverse,
} from "../util/index.mjs";
import {
  concatEffect,
  concatStatement,
  makeEffectStatement,
  makeSequenceExpression,
  prependClosureBody,
  prependControlBody,
} from "./node.mjs";
import {
  isChainPrelude,
  isEarlyPrefixPrelude,
  isNotChainPrelude,
  isNotPrefixPrelude,
  isRegularPrefixPrelude,
  makeEarlyPrefixPrelude,
  makePrefixPrelude,
} from "./prelude.mjs";
import {
  bindSequence,
  filterSequence,
  initSequence,
  listenSequence,
} from "./sequence.mjs";

const getData = compileGet("data");

/**
 * @type {<P extends import("./prelude").NodePrelude, X>(
 *   node: import("./sequence").Sequence<
 *     P,
 *     aran.Effect<unbuild.Atom>[],
 *   >,
 *   value: X,
 * ) => import("./sequence").Sequence<
 *   P | import("./prelude").RegularPrefixPrelude,
 *   X,
 * >}
 */
export const prefix = (node, value) =>
  bindSequence(node, (nodes) =>
    initSequence(map(nodes, makePrefixPrelude), value),
  );

/**
 * @type {<P extends import("./prelude").NodePrelude, X>(
 *   node: import("./sequence").Sequence<
 *     P,
 *     aran.Effect<unbuild.Atom>[],
 *   >,
 *   value: X,
 * ) => import("./sequence").Sequence<
 *   P | import("./prelude").EarlyPrefixPrelude,
 *   X,
 * >}
 */
export const prefixEarly = (node, value) =>
  bindSequence(node, (nodes) =>
    initSequence(map(nodes, makeEarlyPrefixPrelude), value),
  );

/**
 * @type {<P extends import("./prelude").NodePrelude>(
 *   sequence: import("./sequence").Sequence<
 *     P | import("./prelude").PrefixPrelude,
 *     aran.Statement<unbuild.Atom>[],
 *   >,
 *   path: unbuild.Path,
 * ) => import("./sequence").Sequence<
 *   P,
 *   aran.Statement<unbuild.Atom>[],
 * >}
 */
export const unprefixStatement = (node, path) =>
  concatStatement([
    makeEffectStatement(
      initSequence(
        [],
        [
          ...map(
            filterNarrow(listenSequence(node), isEarlyPrefixPrelude),
            getData,
          ),
          ...map(
            filterNarrow(listenSequence(node), isRegularPrefixPrelude),
            getData,
          ),
        ],
      ),
      path,
    ),
    filterSequence(node, isNotPrefixPrelude),
  ]);

/**
 * @type {<P extends import("./prelude").NodePrelude>(
 *   sequence: import("./sequence").Sequence<
 *     P | import("./prelude").PrefixPrelude,
 *     aran.Effect<unbuild.Atom>[],
 *   >,
 *   path: unbuild.Path,
 * ) => import("./sequence").Sequence<
 *   P,
 *   aran.Effect<unbuild.Atom>[],
 * >}
 */
export const unprefixEffect = (node, _path) =>
  concatEffect([
    initSequence(
      [],
      [
        ...map(
          filterNarrow(listenSequence(node), isEarlyPrefixPrelude),
          getData,
        ),
        ...map(
          filterNarrow(listenSequence(node), isRegularPrefixPrelude),
          getData,
        ),
      ],
    ),
    filterSequence(node, isNotPrefixPrelude),
  ]);

/**
 * @type {<P extends import("./prelude").NodePrelude>(
 *   sequence: import("./sequence").Sequence<
 *     P | import("./prelude").PrefixPrelude,
 *     aran.Expression<unbuild.Atom>,
 *   >,
 *   path: unbuild.Path,
 * ) => import("./sequence").Sequence<
 *   P,
 *   aran.Expression<unbuild.Atom>,
 * >},
 */
export const unprefixExpression = (node, path) =>
  makeSequenceExpression(
    initSequence(
      [],
      [
        ...map(
          filterNarrow(listenSequence(node), isEarlyPrefixPrelude),
          getData,
        ),
        ...map(
          filterNarrow(listenSequence(node), isRegularPrefixPrelude),
          getData,
        ),
      ],
    ),
    filterSequence(node, isNotPrefixPrelude),
    path,
  );

/**
 * @type {<P extends import("./prelude").BodyPrelude>(
 *   sequence: import("./sequence").Sequence<
 *     P | import("./prelude").PrefixPrelude,
 *     import("./body").ControlBody<unbuild.Atom>,
 *   >,
 *   path: unbuild.Path,
 * ) => import("./sequence").Sequence<
 *    P,
 *    import("./body").ControlBody<unbuild.Atom>,
 * >}
 */
export const unprefixControlBody = (node, path) =>
  prependControlBody(
    makeEffectStatement(
      initSequence(
        [],
        [
          ...map(
            filterNarrow(listenSequence(node), isEarlyPrefixPrelude),
            getData,
          ),
          ...map(
            filterNarrow(listenSequence(node), isRegularPrefixPrelude),
            getData,
          ),
        ],
      ),
      path,
    ),
    filterSequence(node, isNotPrefixPrelude),
  );

/**
 * @type {<P extends import("./prelude").BodyPrelude>(
 *   sequence: import("./sequence").Sequence<
 *     P | import("./prelude").PrefixPrelude,
 *     import("./body").ClosureBody<unbuild.Atom>,
 *   >,
 *   path: unbuild.Path,
 * ) => import("./sequence").Sequence<
 *    P,
 *    import("./body").ClosureBody<unbuild.Atom>,
 * >}
 */
export const unprefixClosureBody = (node, path) =>
  prependClosureBody(
    makeEffectStatement(
      initSequence(
        [],
        [
          ...map(
            filterNarrow(listenSequence(node), isEarlyPrefixPrelude),
            getData,
          ),
          ...map(
            filterNarrow(listenSequence(node), isRegularPrefixPrelude),
            getData,
          ),
        ],
      ),
      path,
    ),
    filterSequence(node, isNotPrefixPrelude),
  );

/**
 * @type {<P extends import("./prelude").Prelude>(
 *   sequence: import("./sequence").Sequence<
 *     P,
 *     aran.Expression<unbuild.Atom>
 *   >,
 *   path: unbuild.Path,
 * ) => import("./sequence").Sequence<
 *   Exclude<P, (
 *     | import("./prelude").RegularPrefixPrelude
 *     | import("./prelude").ConditionPrelude
 *   )>,
 *   aran.Expression<unbuild.Atom>,
 * >}
 */
export const unprefixChain = ({ head, tail }) =>
  initSequence(
    filterNarrow(head, isNotChainPrelude),
    reduceReverse(
      filterNarrow(head, isChainPrelude),
      (node, prelude) => {
        if (prelude.type === "condition") {
          return /** @type {aran.Expression<unbuild.Atom>} */ ({
            type: "ConditionalExpression",
            test: prelude.data.test,
            consequent: prelude.data.exit,
            alternate: node,
            tag: node.tag,
          });
        } else if (prelude.type === "prefix") {
          return /** @type {aran.Expression<unbuild.Atom>} */ ({
            type: "SequenceExpression",
            head: [prelude.data],
            tail: node,
            tag: node.tag,
          });
        } else {
          throw new AranTypeError(prelude);
        }
      },
      tail,
    ),
  );
