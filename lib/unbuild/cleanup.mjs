import {
  makeClosureBlock,
  makeControlBlock,
  makeEffectStatement,
  makeSequenceExpression,
} from "./node.mjs";
import { filterNarrow, map, compileGet } from "../util/index.mjs";
import {
  isBaseDeclarationPrelude,
  isBlockPrelude,
  isMetaDeclarationPrelude,
  isBodyPrelude,
  isPrefixPrelude,
} from "./prelude.mjs";
import { filterSequence, listenSequence, mapSequence } from "./sequence.mjs";

const getData = compileGet("data");

///////////
// Block //
///////////

/**
 * @type {<P extends import("./prelude").BlockPrelude>(
 *   node: import("./sequence").Sequence<
 *     (
 *       | P
 *       | import("./prelude").DeclarationPrelude
 *       | import("./prelude").PrefixPrelude
 *     ),
 *     aran.ControlBlock<unbuild.Atom>,
 *   >,
 *   path: unbuild.Path,
 * ) => import("./sequence").Sequence<
 *   P,
 *   aran.ControlBlock<unbuild.Atom>,
 * >}
 */
export const cleanupControlBlock = (node, path) =>
  mapSequence(
    filterSequence(node, isBlockPrelude),
    ({ labels, frame, body, tag }) =>
      makeControlBlock(
        labels,
        [
          ...frame,
          ...map(
            filterNarrow(listenSequence(node), isMetaDeclarationPrelude),
            getData,
          ),
          ...map(
            filterNarrow(listenSequence(node), isBaseDeclarationPrelude),
            getData,
          ),
        ],
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
 * @type {<P extends import("./prelude").BlockPrelude>(
 *   node: import("./sequence").Sequence<
 *     (
 *       | P
 *       | import("./prelude").DeclarationPrelude
 *       | import("./prelude").PrefixPrelude
 *     ),
 *     aran.ClosureBlock<unbuild.Atom>,
 *   >,
 *   path: unbuild.Path,
 * ) => import("./sequence").Sequence<
 *   P,
 *   aran.ClosureBlock<unbuild.Atom>,
 * >}
 */
export const cleanupClosureBlock = (node, path) =>
  mapSequence(
    filterSequence(node, isBlockPrelude),
    ({ frame, body, completion, tag }) =>
      makeClosureBlock(
        [
          ...frame,
          ...map(
            filterNarrow(listenSequence(node), isMetaDeclarationPrelude),
            getData,
          ),
          ...map(
            filterNarrow(listenSequence(node), isBaseDeclarationPrelude),
            getData,
          ),
        ],
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

//////////
// Node //
//////////

/**
 * @type {<P extends import("./prelude").BodyPrelude>(
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
export const cleanupStatement = (node, path) =>
  mapSequence(filterSequence(node, isBodyPrelude), (tail) => [
    ...map(
      map(filterNarrow(listenSequence(node), isPrefixPrelude), getData),
      (node) => makeEffectStatement(node, path),
    ),
    ...tail,
  ]);

/**
 * @type {<P extends import("./prelude").BodyPrelude>(
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
export const cleanupEffect = (node, _path) =>
  mapSequence(filterSequence(node, isBodyPrelude), (tail) => [
    ...map(filterNarrow(listenSequence(node), isPrefixPrelude), getData),
    ...tail,
  ]);

/**
 * @type {<P extends import("./prelude").BodyPrelude>(
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
export const cleanupExpression = (node, path) =>
  mapSequence(filterSequence(node, isBodyPrelude), (tail) =>
    makeSequenceExpression(
      map(filterNarrow(listenSequence(node), isPrefixPrelude), getData),
      tail,
      path,
    ),
  );
