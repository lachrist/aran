import { map, filterNarrow, compileGet } from "../util/index.mjs";
import { makeProgram } from "./node.mjs";
import { isHeaderPrelude, isNotHeaderPrelude } from "./prelude.mjs";
import { mapSequence, filterSequence, listenSequence } from "./sequence.mjs";

const getData = compileGet("data");

/**
 * @type {<P extends Exclude<
 *   import("./prelude").Prelude,
 *   import("./prelude").HeaderPrelude
 * >>(
 *   node: import("./sequence").Sequence<
 *     P | import("./prelude").HeaderPrelude,
 *     aran.Program<unbuild.Atom>,
 *   >,
 * ) => import("./sequence").Sequence<
 *   P,
 *   aran.Program<unbuild.Atom>,
 * >}
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
