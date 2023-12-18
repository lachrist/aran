import { AranTypeError } from "../../../error.mjs";
import {
  hasOwn,
  listEntry,
  map,
  pairup,
  reduceEntry,
} from "../../../util/index.mjs";
import {
  bindFake,
  listFakeSaveEffect,
  makeFakeLoadExpression,
} from "./fake/index.mjs";
import {
  listImportSaveEffect,
  makeImportLoadExpression,
} from "./import/index.mjs";
import { flatSequence, mapSequence, zeroSequence } from "../../sequence.mjs";
import {
  bindExternal,
  listExternalSaveEffect,
  makeExternalLoadExpression,
} from "./external/index.mjs";
import {
  bindRegular,
  listRegularSaveEffect,
  makeRegularLoadExpression,
} from "./regular/index.mjs";
import {
  bindGlobalRecord,
  listGlobalRecordSaveEffect,
  makeGlobalRecordLoadExpression,
} from "./global-record/index.mjs";
import {
  bindGlobalObject,
  listGlobalObjectSaveEffect,
  makeGlobalObjectLoadExpression,
} from "./global-object/index.mjs";

/** @type {Record<import(".").StaticFrame["type"], null>} */
export const STATIC = {
  "static-external": null,
  "static-fake": null,
  "static-global-object": null,
  "static-global-record": null,
  "static-import": null,
  "static-regular": null,
};

//////////
// bind //
//////////

// export const bindStaticFrame = (site, frame, { mode }) =>
//   mapSequence(
//     flatSequence(
//       map(listEntry(record), ([variable, kind]) =>
//         mapSequence(bindExternal(site, kind, { mode, variable }), (binding) =>
//           pairup(variable, binding),
//         ),
//       ),
//     ),
//     (entries) => ({
//       type: "static-external",
//       record: reduceEntry(entries),
//     }),
//   );

//   if (frame.type === "static-external") {
//     return bindExternal(site, frame.record, { mode });
//   } else if (frame.type === "static-global-object") {
//     return bindGlobalObject(site, frame.record, {});
//   }
// };

/**
 * @type {(
 *   site: {
 *     path: unbuild.Path,
 *     meta: unbuild.Meta,
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
export const bindExternalStatic = (site, record, { mode }) =>
  mapSequence(
    flatSequence(
      map(listEntry(record), ([variable, kind]) =>
        mapSequence(bindExternal(site, kind, { mode, variable }), (binding) =>
          pairup(variable, binding),
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
 *     meta: unbuild.Meta,
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
export const bindFakeStatic = (site, record, {}) =>
  mapSequence(
    flatSequence(
      map(listEntry(record), ([variable, kind]) =>
        mapSequence(bindFake(site, kind, {}), (binding) =>
          pairup(variable, binding),
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
 *   site: {
 *     path: unbuild.Path,
 *   },
 *   record: Record<
 *     estree.Variable,
 *     import("./global-object/index.js").GlobalObjectKind
 *   >,
 *   options: {
 *     mode: "strict" | "sloppy",
 *   },
 * ) => import("../../sequence.js").PreludeSequence<
 *   import("./index.js").GlobalObjectFrame
 * >}
 */
export const bindGlobalObjectStatic = (site, record, { mode }) =>
  mapSequence(
    flatSequence(
      map(listEntry(record), ([variable, kind]) =>
        mapSequence(
          bindGlobalObject(site, kind, { mode, variable }),
          (binding) => pairup(variable, binding),
        ),
      ),
    ),
    (entries) => ({
      type: "static-global-object",
      record: reduceEntry(entries),
    }),
  );

/**
 * @type {(
 *   site: {
 *     path: unbuild.Path,
 *   },
 *   record: Record<
 *     estree.Variable,
 *     import("./global-record/index.js").GlobalRecordKind
 *   >,
 *   options: {
 *     mode: "strict" | "sloppy",
 *   },
 * ) => import("../../sequence.js").PreludeSequence<
 *   import("./index.js").GlobalRecordFrame
 * >}
 */
export const bindGlobalRecordStatic = (site, record, { mode }) =>
  mapSequence(
    flatSequence(
      map(listEntry(record), ([variable, kind]) =>
        mapSequence(
          bindGlobalRecord(site, kind, { mode, variable }),
          (binding) => pairup(variable, binding),
        ),
      ),
    ),
    (entries) => ({
      type: "static-global-record",
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
export const bindImport = (_site, record, {}) =>
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
export const bindRegularStatic = (site, record, { mode, exports }) =>
  mapSequence(
    flatSequence(
      map(listEntry(record), ([variable, kind]) =>
        mapSequence(
          bindRegular(site, kind, { mode, variable, exports }),
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
 *   operation: import("..").ExpressionOperation,
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
        case "static-global-object": {
          return makeGlobalObjectLoadExpression(
            site,
            frame.record[variable],
            operation,
          );
        }
        case "static-global-record": {
          return makeGlobalRecordLoadExpression(
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
 *   operation: import("..").EffectOperation,
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
        case "static-global-object": {
          return listGlobalObjectSaveEffect(
            site,
            frame.record[variable],
            operation,
          );
        }
        case "static-global-record": {
          return listGlobalRecordSaveEffect(
            site,
            frame.record[variable],
            operation,
          );
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
