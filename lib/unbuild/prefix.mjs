import {
  makeClosureBlock,
  makeControlBlock,
  makeEffectStatement,
  makeSequenceExpression,
} from "./node.mjs";
import { filterNarrow, map, compileGet } from "../util/index.mjs";
import { isBlockPrelude, isBodyPrelude, isPrefixPrelude } from "./prelude.mjs";
import { filterSequence, listenSequence, mapSequence } from "./sequence.mjs";

const getData = compileGet("data");

/**
 * @type {<P extends Exclude<
 *   import("./prelude").Prelude,
 *   import("./prelude").PrefixPrelude
 * >>(
 *   node: import("./sequence").Sequence<
 *     P | import("./prelude").PrefixPrelude,
 *     aran.ControlBlock<unbuild.Atom>,
 *   >,
 *   path: unbuild.Path,
 * ) => import("./sequence").Sequence<
 *   P,
 *   aran.ControlBlock<unbuild.Atom>,
 * >}
 */
export const incorporatePrefixControlBlock = (node, path) =>
  mapSequence(
    filterSequence(node, isBlockPrelude),
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
 * @type {<P extends Exclude<
 *   import("./prelude").Prelude,
 *   import("./prelude").PrefixPrelude
 * >>(
 *   node: import("./sequence").Sequence<
 *     P | import("./prelude").PrefixPrelude,
 *     aran.ClosureBlock<unbuild.Atom>,
 *   >,
 *   path: unbuild.Path,
 * ) => import("./sequence").Sequence<
 *   P,
 *   aran.ClosureBlock<unbuild.Atom>,
 * >}
 */
export const incorporatePrefixClosureBlock = (node, path) =>
  mapSequence(
    filterSequence(node, isBlockPrelude),
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
 * @type {<P extends Exclude<
 *   import("./prelude").Prelude,
 *   import("./prelude").PrefixPrelude
 * >>(
 *   node: import("./sequence").Sequence<
 *     P | import("./prelude").PrefixPrelude,
 *     aran.Statement<unbuild.Atom>[],
 *   >,
 *   path: unbuild.Path,
 * ) => import("./sequence").Sequence<
 *   P,
 *   aran.Statement<unbuild.Atom>[],
 * >}
 */
export const incorporatePrefixStatement = (node, path) =>
  mapSequence(filterSequence(node, isBodyPrelude), (tail) => [
    ...map(
      map(filterNarrow(listenSequence(node), isPrefixPrelude), getData),
      (node) => makeEffectStatement(node, path),
    ),
    ...tail,
  ]);

/**
 * @type {<P extends Exclude<
 *   import("./prelude").Prelude,
 *   import("./prelude").PrefixPrelude
 * >>(
 *   node: import("./sequence").Sequence<
 *     P | import("./prelude").PrefixPrelude,
 *     aran.Effect<unbuild.Atom>[],
 *   >,
 *   path: unbuild.Path,
 * ) => import("./sequence").Sequence<
 *   P,
 *   aran.Effect<unbuild.Atom>[],
 * >}
 */
export const incorporatePrefixEffect = (node, _path) =>
  mapSequence(filterSequence(node, isBodyPrelude), (tail) => [
    ...map(filterNarrow(listenSequence(node), isPrefixPrelude), getData),
    ...tail,
  ]);

/**
 * @type {<P extends Exclude<
 *   import("./prelude").Prelude,
 *   import("./prelude").PrefixPrelude
 * >>(
 *   node: import("./sequence").Sequence<
 *     P | import("./prelude").PrefixPrelude,
 *     aran.Expression<unbuild.Atom>,
 *   >,
 *   path: unbuild.Path,
 * ) => import("./sequence").Sequence<
 *   P,
 *   aran.Expression<unbuild.Atom>,
 * >}
 */
export const incorporatePrefixExpression = (node, path) =>
  mapSequence(filterSequence(node, isBodyPrelude), (tail) =>
    makeSequenceExpression(
      map(filterNarrow(listenSequence(node), isPrefixPrelude), getData),
      tail,
      path,
    ),
  );
