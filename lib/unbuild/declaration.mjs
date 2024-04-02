import { filterNarrow, map, compileGet, concatXXX } from "../util/index.mjs";
import { makeClosureBlock, makeControlBlock } from "./node.mjs";
import {
  isBaseDeclarationPrelude,
  isMetaDeclarationPrelude,
  isNotDeclarationPrelude,
} from "./prelude.mjs";
import { filterSequence, listenSequence, mapSequence } from "./sequence.mjs";

const getData = compileGet("data");

/**
 * @type {<P extends Exclude<
 *   import("./prelude").Prelude,
 *   import("./prelude").DeclarationPrelude
 * >>(
 *   node: import("./sequence").Sequence<
 *     P | import("./prelude").DeclarationPrelude,
 *     aran.ClosureBlock<unbuild.Atom>,
 *   >,
 * ) => import("./sequence").Sequence<
 *   P,
 *   aran.ClosureBlock<unbuild.Atom>,
 * >}
 */
export const incorporateDeclarationClosureBlock = (node) =>
  mapSequence(
    filterSequence(node, isNotDeclarationPrelude),
    ({ frame, body, completion, tag }) =>
      makeClosureBlock(
        concatXXX(
          frame,
          map(
            filterNarrow(listenSequence(node), isMetaDeclarationPrelude),
            getData,
          ),
          map(
            filterNarrow(listenSequence(node), isBaseDeclarationPrelude),
            getData,
          ),
        ),
        body,
        completion,
        tag,
      ),
  );

/**
 * @type {<P extends Exclude<
 *   import("./prelude").Prelude,
 *   import("./prelude").DeclarationPrelude
 * >>(
 *   node: import("./sequence").Sequence<
 *     P | import("./prelude").DeclarationPrelude,
 *     aran.ControlBlock<unbuild.Atom>,
 *   >,
 * ) => import("./sequence").Sequence<
 *   P,
 *   aran.ControlBlock<unbuild.Atom>,
 * >}
 */
export const incorporateDeclarationControlBlock = (node) =>
  mapSequence(
    filterSequence(node, isNotDeclarationPrelude),
    ({ labels, frame, body, tag }) =>
      makeControlBlock(
        labels,
        concatXXX(
          frame,
          map(
            filterNarrow(listenSequence(node), isMetaDeclarationPrelude),
            getData,
          ),
          map(
            filterNarrow(listenSequence(node), isBaseDeclarationPrelude),
            getData,
          ),
        ),
        body,
        tag,
      ),
  );
