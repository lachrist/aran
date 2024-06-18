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
    ({ bindings, body, tail, tag }) =>
      makeClosureBlock(
        concatXXX(
          bindings,
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
        tail,
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
    ({ labels, bindings, body, tag }) =>
      makeControlBlock(
        labels,
        concatXXX(
          bindings,
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
