import { AranTypeError } from "../../../error.mjs";
import { hasOwn, map, reduceEntry } from "../../../util/index.mjs";
import { flatSequence, mapSequence } from "../../sequence.mjs";
import {
  setupDeadzoneBinding,
  makeDeadzoneLoadExpression,
  listDeadzoneSaveEffect,
} from "./deadzone.mjs";

import {
  setupHoistingBinding,
  makeHoistingLoadExpression,
  listHoistingSaveEffect,
} from "./hoisting.mjs";

import {
  makeImportLoadExpression,
  listImportSaveEffect,
  setupImportBinding,
} from "./import.mjs";

/**
 * @type {(
 *   site: import("../../site").VoidSite,
 *   entries: import(".").BlockEntry[],
 *   link: null | {
 *     import: Record<estree.Variable, {
 *       source: estree.Source,
 *       specifier: estree.Specifier,
 *     }>,
 *     export: Record<estree.Variable, estree.Specifier[]>,
 *   },
 * ) => import("../../sequence").PreludeSequence<
 *   import(".").BlockFrame
 * >}
 */
export const setupBlockFrame = ({ path }, entries, link) =>
  mapSequence(
    flatSequence(
      map(entries, (entry) => {
        if (entry[1] === "import") {
          return setupImportBinding({ path }, entry, link);
        } else if (entry[1] === "let" || entry[1] === "const") {
          return setupDeadzoneBinding({ path }, entry, link);
        } else if (entry[1] === "var") {
          return setupHoistingBinding({ path }, entry, link);
        } else {
          throw new AranTypeError("invalid block entry kind", entry[1]);
        }
      }),
    ),
    (entries) => ({
      type: "block",
      record: reduceEntry(entries),
    }),
  );

/**
 * @type {(
 *   site: import("../../site").VoidSite,
 *   frame: import(".").BlockFrame,
 *   operation: (
 *     | import("..").ReadOperation
 *     | import("..").TypeofOperation
 *     | import("..").DiscardOperation
 *   ),
 * ) => aran.Expression<unbuild.Atom> | null}
 */
export const makeBlockLoadExpression = ({ path }, frame, operation) => {
  if (hasOwn(frame.record, operation.variable)) {
    const binding = frame.record[operation.variable];
    if (binding.kind === "import") {
      return makeImportLoadExpression({ path }, binding, operation);
    } else if (binding.kind === "let" || binding.kind === "const") {
      return makeDeadzoneLoadExpression({ path }, binding, operation);
    } else if (binding.kind === "var") {
      return makeHoistingLoadExpression({ path }, binding, operation);
    } else {
      throw new AranTypeError("invalid block binding kind", binding.kind);
    }
  } else {
    return null;
  }
};

/**
 * @type {(
 *   site: import("../../site").VoidSite,
 *   frame: import(".").BlockFrame,
 *   operation: (
 *     | import("..").WriteOperation
 *     | import("..").InitializeOperation
 *   ),
 * ) => aran.Effect<unbuild.Atom>[] | null}
 */
export const listBlockSaveEffect = ({ path }, frame, operation) => {
  if (hasOwn(frame.record, operation.variable)) {
    const binding = frame.record[operation.variable];
    if (binding.kind === "import") {
      return listImportSaveEffect({ path }, binding, operation);
    } else if (binding.kind === "let" || binding.kind === "const") {
      return listDeadzoneSaveEffect({ path }, binding, operation);
    } else if (binding.kind === "var") {
      return listHoistingSaveEffect({ path }, binding, operation);
    } else {
      throw new AranTypeError("invalid block binding kind", binding.kind);
    }
  } else {
    return null;
  }
};
