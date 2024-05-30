import {
  makeClosureBlock,
  makeControlBlock,
  makeEffectStatement,
  makeSequenceExpression,
} from "./node.mjs";
import { filterNarrow, map, compileGet, pairup } from "../util/index.mjs";
import { isNotPrefixPrelude, isPrefixPrelude } from "./prelude.mjs";
import { filterSequence, listenSequence, mapSequence } from "../sequence.mjs";

const getData = compileGet("data");

/**
 * @type {<P extends import("./prelude").Prelude>(
 *   node: import("../sequence").Sequence<
 *     P,
 *     aran.ControlBlock<import("./atom").Atom>,
 *   >,
 *   path: import("../path").Path,
 * ) => import("./prelude").PrefixPrelude extends P ?
 *   import("../sequence").Sequence<
 *     Exclude<P, import("./prelude").PrefixPrelude>,
 *     aran.ControlBlock<import("./atom").Atom>,
 *   >
 *   : unknown
 * }
 */
export const incorporatePrefixControlBlock = (node, path) =>
  mapSequence(
    filterSequence(node, isNotPrefixPrelude),
    ({ labels, frame, body, tag }) =>
      makeControlBlock(
        labels,
        frame,
        [
          ...map(
            map(filterNarrow(listenSequence(node), isPrefixPrelude), getData),
            (node) => makeEffectStatement(node, path),
          ),
          ...body,
        ],
        tag,
      ),
  );

/**
 * @type {<P extends import("./prelude").Prelude>(
 *   node: import("../sequence").Sequence<
 *     P,
 *     aran.RoutineBlock<import("./atom").Atom>,
 *   >,
 *   path: import("../path").Path,
 * ) => import("./prelude").PrefixPrelude extends P ?
 *   import("../sequence").Sequence<
 *     Exclude<P, import("./prelude").PrefixPrelude>,
 *     aran.RoutineBlock<import("./atom").Atom>,
 *   >
 *   : unknown
 * }
 */
export const incorporatePrefixClosureBlock = (node, path) =>
  mapSequence(
    filterSequence(node, isNotPrefixPrelude),
    ({ frame, body, completion, tag }) =>
      makeClosureBlock(
        frame,
        [
          ...map(
            map(filterNarrow(listenSequence(node), isPrefixPrelude), getData),
            (node) => makeEffectStatement(node, path),
          ),
          ...body,
        ],
        completion,
        tag,
      ),
  );

/**
 * @type {<P extends import("./prelude").Prelude>(
 *   node: import("../sequence").Sequence<
 *     P,
 *     aran.Statement<import("./atom").Atom>[],
 *   >,
 *   path: import("../path").Path,
 * ) => import("./prelude").PrefixPrelude extends P
 *   ? import("../sequence").Sequence<
 *     Exclude<P, import("./prelude").PrefixPrelude>,
 *     aran.Statement<import("./atom").Atom>[],
 *   >
 *   : unknown
 * }
 */
export const incorporatePrefixStatement = (node, path) =>
  mapSequence(filterSequence(node, isNotPrefixPrelude), (tail) => [
    ...map(
      map(filterNarrow(listenSequence(node), isPrefixPrelude), getData),
      (node) => makeEffectStatement(node, path),
    ),
    ...tail,
  ]);

/**
 * @type {<P extends import("./prelude").Prelude>(
 *   node: import("../sequence").Sequence<
 *     P,
 *     aran.Effect<import("./atom").Atom>[],
 *   >,
 *   path: import("../path").Path,
 * ) => import("./prelude").PrefixPrelude extends P
 *   ? import("../sequence").Sequence<
 *     Exclude<P, import("./prelude").PrefixPrelude>,
 *     aran.Effect<import("./atom").Atom>[],
 *   >
 *   : unknown
 * }
 */
export const incorporatePrefixEffect = (node, _path) =>
  mapSequence(filterSequence(node, isNotPrefixPrelude), (tail) => [
    ...map(filterNarrow(listenSequence(node), isPrefixPrelude), getData),
    ...tail,
  ]);

/**
 * @type {<P extends import("./prelude").Prelude>(
 *   node: import("../sequence").Sequence<
 *     P,
 *     aran.Expression<import("./atom").Atom>,
 *   >,
 *   path: import("../path").Path,
 * ) => import("./prelude").PrefixPrelude extends P
 *   ? import("../sequence").Sequence<
 *     Exclude<P, import("./prelude").PrefixPrelude>,
 *     aran.Expression<import("./atom").Atom>,
 *   >
 *   : unknown
 * }
 */
export const incorporatePrefixExpression = (node, path) =>
  mapSequence(filterSequence(node, isNotPrefixPrelude), (tail) =>
    makeSequenceExpression(
      map(filterNarrow(listenSequence(node), isPrefixPrelude), getData),
      tail,
      path,
    ),
  );

/**
 * @type {<P extends import("./prelude").Prelude>(
 *   node: import("../sequence").Sequence<
 *     P,
 *     [
 *       aran.Expression<import("./atom").Atom>,
 *       aran.Expression<import("./atom").Atom>,
 *     ],
 *   >,
 *   path: import("../path").Path,
 * ) => import("./prelude").PrefixPrelude extends P
 *   ? import("../sequence").Sequence<
 *     Exclude<P, import("./prelude").PrefixPrelude>,
 *     [
 *       aran.Expression<import("./atom").Atom>,
 *       aran.Expression<import("./atom").Atom>,
 *     ],
 *   >
 *   : unknown
 * }
 */
export const incorporatePrefixExpressionPair = (node, path) =>
  mapSequence(filterSequence(node, isNotPrefixPrelude), (tail) =>
    pairup(
      makeSequenceExpression(
        map(filterNarrow(listenSequence(node), isPrefixPrelude), getData),
        tail[0],
        path,
      ),
      tail[1],
    ),
  );
