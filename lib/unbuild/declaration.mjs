import { filterNarrow, map, compileGet, concatXXX } from "../util/index.mjs";
import { makeClosureBlock, makeControlBlock } from "./node.mjs";
import {
  isBaseDeclarationPrelude,
  isMetaDeclarationPrelude,
  isNotDeclarationPrelude,
} from "./prelude.mjs";
import { filterSequence, listenSequence, mapSequence } from "../sequence.mjs";

const getData = compileGet("data");

/**
 * @type {<P extends import("./prelude").Prelude>(
 *   node: import("../sequence").Sequence<
 *     P,
 *     import("./atom").RoutineBlock,
 *   >,
 * ) => import("./prelude").DeclarationPrelude extends P
 *   ? import("../sequence").Sequence<
 *     Exclude<P, import("./prelude").DeclarationPrelude>,
 *     import("./atom").RoutineBlock,
 *   >
 *   : unknown
 * }
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
 * @type {<P extends import("./prelude").Prelude>(
 *   node: import("../sequence").Sequence<
 *     P,
 *     import("./atom").ControlBlock,
 *   >,
 * ) => import("./prelude").DeclarationPrelude extends P
 *   ? import("../sequence").Sequence<
 *     Exclude<P , import("./prelude").DeclarationPrelude>,
 *     import("./atom").ControlBlock,
 *   >
 *   : unknown
 * }
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
