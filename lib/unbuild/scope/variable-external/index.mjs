import { map, reduceEntry, pairup, hasOwn } from "../../../util/index.mjs";
import { forkMeta, nextMeta } from "../../meta.mjs";
import { mapSequence, flatSequence } from "../../sequence.mjs";
import {
  listExternalBindingSaveEffect,
  makeExternalBindingLoadExpression,
  setupExternalBinding,
} from "./binding.mjs";

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

/**
 * @type {(
 *   site: import("../../site").VoidSite,
 *   frame: import(".").ExternalFrame,
 *   operation: import("..").VariableLoadOperation,
 * ) => aran.Expression<unbuild.Atom> | null}
 */
export const makeExternalLoadExpression = (site, frame, operation) => {
  if (hasOwn(frame.record, operation.variable)) {
    return makeExternalBindingLoadExpression(
      site,
      frame.record[operation.variable],
      operation,
    );
  } else {
    return null;
  }
};

/**
 * @type {(
 *   site: import("../../site").VoidSite,
 *   frame: import(".").ExternalFrame,
 *   operation: import("..").VariableSaveOperation,
 * ) => aran.Effect<unbuild.Atom>[] | null}
 */
export const listExternalSaveEffect = (site, frame, operation) => {
  if (hasOwn(frame.record, operation.variable)) {
    return listExternalBindingSaveEffect(
      site,
      frame.record[operation.variable],
      operation,
    );
  } else {
    return null;
  }
};
