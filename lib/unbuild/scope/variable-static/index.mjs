import { AranTypeError } from "../../../error.mjs";
import { hasOwn, map, reduceEntry } from "../../../util/index.mjs";
import { makeEarlyErrorPrelude } from "../../prelude.mjs";
import {
  flatSequence,
  mapSequence,
  tellSequence,
  thenSequence,
} from "../../sequence.mjs";
import { reportDuplicate } from "../error.mjs";
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

/* eslint-disable local/no-impure */
/**
 * @type {(
 *   entries: import(".").StaticEntry[],
 * ) => estree.Variable[]}
 */
const listDuplicate = (entries) => {
  const { length } = entries;
  const duplicates = [];
  for (let index1 = 0; index1 < length; index1 += 1) {
    const [variable1, kind1] = entries[index1];
    for (let index2 = index1 + 1; index2 < length; index2 += 1) {
      const [variable2, kind2] = entries[index2];
      if (variable1 === variable2 && (kind1 !== "var" || kind2 !== "var")) {
        duplicates[duplicates.length] = variable1;
      }
    }
  }
  return duplicates;
};
/* eslint-enable local/no-impure */

/**
 * @type {(
 *   site: import("../../site").VoidSite,
 *   entries: import(".").StaticEntry[],
 *   link: null | {
 *     import: Record<estree.Variable, {
 *       source: estree.Source,
 *       specifier: estree.Specifier,
 *     }>,
 *     export: Record<estree.Variable, estree.Specifier[]>,
 *   },
 * ) => import("../../sequence").PreludeSequence<
 *   import(".").StaticFrame
 * >}
 */
export const setupStaticFrame = ({ path }, entries, link) =>
  mapSequence(
    thenSequence(
      tellSequence(
        map(listDuplicate(entries), (variable) =>
          makeEarlyErrorPrelude({
            guard: null,
            message: reportDuplicate(variable),
            path,
          }),
        ),
      ),
      flatSequence(
        map(entries, (entry) => {
          if (entry[1] === "import") {
            return setupImportBinding({ path }, entry, link);
          } else if (entry[1] === "let" || entry[1] === "const") {
            return setupDeadzoneBinding({ path }, entry, link);
          } else if (entry[1] === "var") {
            return setupHoistingBinding({ path }, entry, link);
          } else {
            throw new AranTypeError(entry[1]);
          }
        }),
      ),
    ),
    (entries) => ({
      type: "static",
      record: reduceEntry(entries),
    }),
  );

/**
 * @type {(
 *   site: import("../../site").VoidSite,
 *   frame: import(".").StaticFrame,
 *   operation: import("..").VariableLoadOperation,
 * ) => aran.Expression<unbuild.Atom> | null}
 */
export const makeStaticLoadExpression = ({ path }, frame, operation) => {
  if (hasOwn(frame.record, operation.variable)) {
    const binding = frame.record[operation.variable];
    if (binding.kind === "import") {
      return makeImportLoadExpression({ path }, binding, operation);
    } else if (binding.kind === "let" || binding.kind === "const") {
      return makeDeadzoneLoadExpression({ path }, binding, operation);
    } else if (binding.kind === "var") {
      return makeHoistingLoadExpression({ path }, binding, operation);
    } else {
      throw new AranTypeError(binding.kind);
    }
  } else {
    return null;
  }
};

/**
 * @type {(
 *   site: import("../../site").VoidSite,
 *   frame: import(".").StaticFrame,
 *   operation: import("..").VariableSaveOperation,
 * ) => aran.Effect<unbuild.Atom>[] | null}
 */
export const listStaticSaveEffect = ({ path }, frame, operation) => {
  if (hasOwn(frame.record, operation.variable)) {
    const binding = frame.record[operation.variable];
    if (binding.kind === "import") {
      return listImportSaveEffect({ path }, binding, operation);
    } else if (binding.kind === "let" || binding.kind === "const") {
      return listDeadzoneSaveEffect({ path }, binding, operation);
    } else if (binding.kind === "var") {
      return listHoistingSaveEffect({ path }, binding, operation);
    } else {
      throw new AranTypeError(binding.kind);
    }
  } else {
    return null;
  }
};
