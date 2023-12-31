import { map, reduceEntry, pairup } from "../../../util/index.mjs";
import { forkMeta, nextMeta } from "../../meta.mjs";
import { mapSequence, flatSequence } from "../../sequence.mjs";
import { setupExternalBinding } from "./binding.mjs";

/**
 * @type {(
 *   site: {
 *     path: unbuild.Path,
 *     meta: import("../../meta").Meta,
 *   },
 *   options: {
 *     mode: "strict" | "sloppy",
 *     entries: [
 *       estree.Variable,
 *       import(".").ExternalKind
 *     ][],
 *   },
 * ) => import("../../sequence.js").PreludeSequence<
 *   import(".").ExternalFrame
 * >}
 */
export const setupExternalStaticFrame = ({ path, meta }, { mode, entries }) =>
  mapSequence(
    flatSequence(
      map(entries, ([variable, kind]) =>
        mapSequence(
          setupExternalBinding(
            { path, meta: forkMeta((meta = nextMeta(meta))) },
            kind,
            { mode, variable },
          ),
          (binding) => pairup(variable, binding),
        ),
      ),
    ),
    (entries) => ({
      type: "external",
      record: reduceEntry(entries),
    }),
  );
