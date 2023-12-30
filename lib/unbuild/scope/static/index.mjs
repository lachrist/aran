import {
  hasOwn,
  listEntry,
  map,
  pairup,
  reduceEntry,
} from "../../../util/index.mjs";
import { AranTypeError } from "../../../error.mjs";
import { flatSequence, mapSequence, zeroSequence } from "../../sequence.mjs";
import {
  setupExternalBinding,
  listExternalSaveEffect,
  makeExternalLoadExpression,
} from "./external/index.mjs";
import {
  setupFakeBinding,
  listFakeSaveEffect,
  makeFakeLoadExpression,
} from "./fake/index.mjs";
import {
  listImportSaveEffect,
  makeImportLoadExpression,
} from "./import/index.mjs";
import {
  setupRegularBinding,
  listRegularSaveEffect,
  makeRegularLoadExpression,
} from "./regular/index.mjs";
import { forkMeta, nextMeta } from "../../meta.mjs";

/** @type {Record<import(".").StaticFrame["type"], null>} */
export const STATIC = {
  "static-external": null,
  "static-fake": null,
  "static-import": null,
  "static-regular": null,
};

//////////
// bind //
//////////

/**
 * @type {(
 *   site: {
 *     path: unbuild.Path,
 *     meta: import("../../meta").Meta,
 *   },
 *   record: Record<
 *     estree.Variable,
 *     import("./external/index.js").ExternalKind
 *   >,
 *   options: {
 *     mode: "strict" | "sloppy",
 *   },
 * ) => import("../../sequence.js").PreludeSequence<
 *   import("./index.js").ExternalFrame
 * >}
 */
export const setupExternalStaticFrame = ({ path, meta }, record, { mode }) =>
  mapSequence(
    flatSequence(
      map(listEntry(record), ([variable, kind]) =>
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
      type: "static-external",
      record: reduceEntry(entries),
    }),
  );

/**
 * @type {(
 *   site: {
 *     path: unbuild.Path,
 *     meta: import("../../meta").Meta,
 *   },
 *   record: Record<
 *     estree.Variable,
 *     import("./fake").FakeKind
 *   >,
 *   options: {},
 * ) => import("../../sequence.js").EffectSequence<
 *   import(".").FakeFrame
 * >}
 */
export const setupFakeFrame = ({ path, meta }, record, {}) =>
  mapSequence(
    flatSequence(
      map(listEntry(record), ([variable, kind]) =>
        mapSequence(
          setupFakeBinding(
            { path, meta: forkMeta((meta = nextMeta(meta))) },
            kind,
            {},
          ),
          (binding) => pairup(variable, binding),
        ),
      ),
    ),
    (entries) => ({
      type: "static-fake",
      record: reduceEntry(entries),
    }),
  );

/**
 * @type {(
 *   site: {},
 *   record: Record<
 *     estree.Variable,
 *     import("./import").ImportBinding
 *   >,
 *   options: {},
 * ) => import("../../sequence.js").PreludeSequence<
 *   import("./index.js").ImportFrame
 * >}
 */
export const setupImportFrame = ({}, record, {}) =>
  zeroSequence({
    type: "static-import",
    record,
  });

/**
 * @type {(
 *   site: {
 *     path: unbuild.Path,
 *   },
 *   record: Record<
 *     estree.Variable,
 *     import("./regular/index.js").RegularKind
 *   >,
 *   options: {
 *     mode: "strict" | "sloppy",
 *     exports: Record<estree.Variable, estree.Specifier[]>,
 *   },
 * ) => import("../../sequence.js").PreludeSequence<
 *   import("./index.js").RegularFrame
 * >}
 */
export const setupRegularStaticFrame = ({ path }, record, { mode, exports }) =>
  mapSequence(
    flatSequence(
      map(listEntry(record), ([variable, kind]) =>
        mapSequence(
          setupRegularBinding({ path }, kind, {
            mode,
            variable,
            exports,
          }),
          (binding) => pairup(variable, binding),
        ),
      ),
    ),
    (entries) => ({
      type: "static-regular",
      record: reduceEntry(entries),
    }),
  );

//////////
// load //
//////////

/**
 * @type {(
 *   site: {
 *     path: unbuild.Path,
 *   },
 *   frame: import(".").StaticFrame,
 *   operation: import("..").LoadOperation,
 * ) => aran.Expression<unbuild.Atom> | null}
 */
export const makeStaticLoadExpresssion = (site, frame, operation) => {
  if (
    operation.type === "read" ||
    operation.type === "typeof" ||
    operation.type === "discard"
  ) {
    const { variable } = operation;
    if (hasOwn(frame.record, variable)) {
      switch (frame.type) {
        case "static-external": {
          return makeExternalLoadExpression(
            site,
            frame.record[variable],
            operation,
          );
        }
        case "static-fake": {
          return makeFakeLoadExpression(
            site,
            frame.record[variable],
            operation,
          );
        }
        case "static-import": {
          return makeImportLoadExpression(
            site,
            frame.record[variable],
            operation,
          );
        }
        case "static-regular": {
          return makeRegularLoadExpression(
            site,
            frame.record[variable],
            operation,
          );
        }
        default: {
          throw new AranTypeError("invalid static frame", frame);
        }
      }
    } else {
      return null;
    }
  } else {
    return null;
  }
};

/**
 * @type {(
 *   site: {
 *     path: unbuild.Path,
 *   },
 *   frame: import("./index.d.ts").StaticFrame,
 *   operation: import("..").SaveOperation,
 * ) => aran.Effect<unbuild.Atom>[] | null}
 */
export const listStaticSaveEffect = (site, frame, operation) => {
  if (operation.type === "initialize" || operation.type === "write") {
    const { variable } = operation;
    if (hasOwn(frame.record, variable)) {
      switch (frame.type) {
        case "static-external": {
          return listExternalSaveEffect(
            site,
            frame.record[variable],
            operation,
          );
        }
        case "static-fake": {
          return listFakeSaveEffect(site, frame.record[variable], operation);
        }
        case "static-import": {
          return listImportSaveEffect(site, frame.record[variable], operation);
        }
        case "static-regular": {
          return listRegularSaveEffect(site, frame.record[variable], operation);
        }
        default: {
          throw new AranTypeError("invalid static frame", frame);
        }
      }
    } else {
      return null;
    }
  } else {
    return null;
  }
};
