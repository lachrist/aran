import { map, filterNarrow, compileGet } from "../util/index.mjs";
import { makeProgram } from "./node.mjs";
import { isHeaderPrelude, isNotHeaderPrelude } from "./prelude.mjs";
import { mapSequence, filterSequence, listenSequence } from "../sequence.mjs";

const getData = compileGet("data");

/**
 * @type {<P extends import("./prelude").Prelude>(
 *   node: import("../sequence").Sequence<
 *     P,
 *     aran.Program<unbuild.Atom>,
 *   >,
 * ) => import("./prelude").HeaderPrelude extends P
 *   ? import("../sequence").Sequence<
 *     Exclude<P, import("./prelude").HeaderPrelude>,
 *     aran.Program<unbuild.Atom>,
 *   >
 *   : unknown
 * }
 */
export const incorporateHeaderProgram = (node) =>
  mapSequence(
    filterSequence(node, isNotHeaderPrelude),
    ({ sort, head, body, tag }) =>
      makeProgram(
        sort,
        [
          ...head,
          ...map(filterNarrow(listenSequence(node), isHeaderPrelude), getData),
        ],
        body,
        tag,
      ),
  );
