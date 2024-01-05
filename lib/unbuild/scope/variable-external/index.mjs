import { map, reduceEntry, hasOwn } from "../../../util/index.mjs";
import { forkMeta, nextMeta } from "../../meta.mjs";
import { mapSequence, flatSequence } from "../../sequence.mjs";
import {
  listExternalBindingSaveEffect,
  makeExternalBindingLoadExpression,
  setupExternalBinding,
} from "./binding.mjs";

/**
 * @type {(
 *   site: import("../../site").LeafSite,
 *   entries: import(".").ExternalEntry[],
 *   options: {
 *     mode: "strict" | "sloppy",
 *   },
 * ) => import("../../sequence").Sequence<
 *   import("../../prelude").NodePrelude,
 *   import(".").ExternalFrame,
 * >}
 */
export const setupExternalFrame = ({ path, meta }, entries, options) =>
  mapSequence(
    flatSequence(
      map(entries, (entry) =>
        setupExternalBinding(
          { path, meta: forkMeta((meta = nextMeta(meta))) },
          entry,
          options,
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
 * ) => import("../../sequence").ExpressionSequence | null}
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
 * ) => import("../../sequence").EffectSequence | null}
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
