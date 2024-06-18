import {
  makeRoutineBlock,
  makeControlBlock,
  makeEffectStatement,
  makeSequenceExpression,
} from "./node.mjs";
import {
  filterNarrow,
  map,
  compileGet,
  pairup,
  concatXX,
} from "../util/index.mjs";
import { isNotPrefixPrelude, isPrefixPrelude } from "./prelude.mjs";
import { filterSequence, listenSequence, mapSequence } from "../sequence.mjs";
import { makePreludeBlock } from "../node.mjs";

const getData = compileGet("data");

/**
 * @type {<P extends import("./prelude").Prelude>(
 *   node: import("../sequence").Sequence<
 *     P,
 *     import("./atom").ControlBlock,
 *   >,
 *   path: import("../path").Path,
 * ) => import("./prelude").PrefixPrelude extends P ?
 *   import("../sequence").Sequence<
 *     Exclude<P, import("./prelude").PrefixPrelude>,
 *     import("./atom").ControlBlock,
 *   >
 *   : unknown
 * }
 */
export const incorporatePrefixControlBlock = (node, path) =>
  mapSequence(
    filterSequence(node, isNotPrefixPrelude),
    ({ labels, bindings, body, tag }) =>
      makeControlBlock(
        labels,
        bindings,
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
 *     import("./atom").RoutineBlock,
 *   >,
 *   path: import("../path").Path,
 * ) => import("./prelude").PrefixPrelude extends P ?
 *   import("../sequence").Sequence<
 *     Exclude<P, import("./prelude").PrefixPrelude>,
 *     import("./atom").RoutineBlock,
 *   >
 *   : unknown
 * }
 */
export const incorporatePrefixRoutineBlock = (node, path) =>
  mapSequence(
    filterSequence(node, isNotPrefixPrelude),
    ({ bindings, body, tail, tag }) =>
      makeRoutineBlock(
        bindings,
        [
          ...map(
            map(filterNarrow(listenSequence(node), isPrefixPrelude), getData),
            (node) => makeEffectStatement(node, path),
          ),
          ...body,
        ],
        tail,
        tag,
      ),
  );

/**
 * @type {<P extends import("./prelude").Prelude>(
 *   node: import("../sequence").Sequence<
 *     P,
 *     import("./atom").PreludeBlock,
 *   >,
 *   path: import("../path").Path,
 * ) => import("./prelude").PrefixPrelude extends P ?
 *   import("../sequence").Sequence<
 *     Exclude<P, import("./prelude").PrefixPrelude>,
 *     import("./atom").PreludeBlock,
 *   >
 *   : unknown
 * }
 */
export const incorporatePrefixPreludeBlock = (node, _path) =>
  mapSequence(
    filterSequence(node, isNotPrefixPrelude),
    ({ bindings, head, body, tail, tag }) =>
      makePreludeBlock(
        bindings,
        concatXX(
          map(filterNarrow(listenSequence(node), isPrefixPrelude), getData),
          head,
        ),
        body,
        tail,
        tag,
      ),
  );

/**
 * @type {<P extends import("./prelude").Prelude>(
 *   node: import("../sequence").Sequence<
 *     P,
 *     import("./atom").Statement[],
 *   >,
 *   path: import("../path").Path,
 * ) => import("./prelude").PrefixPrelude extends P
 *   ? import("../sequence").Sequence<
 *     Exclude<P, import("./prelude").PrefixPrelude>,
 *     import("./atom").Statement[],
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
 *     import("./atom").Effect[],
 *   >,
 *   path: import("../path").Path,
 * ) => import("./prelude").PrefixPrelude extends P
 *   ? import("../sequence").Sequence<
 *     Exclude<P, import("./prelude").PrefixPrelude>,
 *     import("./atom").Effect[],
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
 *     import("./atom").Expression,
 *   >,
 *   path: import("../path").Path,
 * ) => import("./prelude").PrefixPrelude extends P
 *   ? import("../sequence").Sequence<
 *     Exclude<P, import("./prelude").PrefixPrelude>,
 *     import("./atom").Expression,
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
 *       import("./atom").Expression,
 *       import("./atom").Expression,
 *     ],
 *   >,
 *   path: import("../path").Path,
 * ) => import("./prelude").PrefixPrelude extends P
 *   ? import("../sequence").Sequence<
 *     Exclude<P, import("./prelude").PrefixPrelude>,
 *     [
 *       import("./atom").Expression,
 *       import("./atom").Expression,
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
