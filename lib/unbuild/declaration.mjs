import { filterNarrow, map, compileGet, concatXXX } from "../util/index.mjs";
import { makeRoutineBlock, makeControlBlock } from "./node.mjs";
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
export const incorporateDeclarationRoutineBlock = (node) =>
  mapSequence(
    filterSequence(node, isNotDeclarationPrelude),
    ({ bindings, head, body, tail, tag }) =>
      makeRoutineBlock(
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
        head,
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
