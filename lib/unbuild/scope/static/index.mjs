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

/**
 * @type {(
 *   site: {
 *     path: unbuild.Path,
 *     meta: unbuild.Meta,
 *   },
 *   context: {
 *     mode: "strict" | "sloppy",
 *   },
 *   options: {
 *     record: Record<
 *       estree.Variable,
 *       import("./external/index.js").ExternalKind
 *     >,
 *   },
 * ) => import("../../sequence.js").PreludeSequence<
 *   import("./index.js").ExternalFrame
 * >}
 */
export const bindExternalStatic = (site, context, { record }) =>
  mapSequence(
    flatSequence(
      map(listEntry(record), ([variable, kind]) =>
        mapSequence(
          bindExternal(site, context, { variable, kind }),
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
 *     meta: unbuild.Meta,
 *   },
 *   context: {
 *     mode: "strict" | "sloppy",
 *   },
 *   options: {
 *     record: Record<
 *       estree.Variable,
 *       import("./fake").FakeKind
 *     >,
 *   },
 * ) => import("../../sequence.js").EffectSequence<
 *   import(".").FakeFrame
 * >}
 */
export const bindFakeStatic = (site, context, { record }) =>
  mapSequence(
    flatSequence(
      map(listEntry(record), ([variable, kind]) =>
        mapSequence(bindFake(site, context, { variable, kind }), (binding) =>
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
 *   context: {
 *     mode: "strict" | "sloppy",
 *   },
 *   options: {
 *     record: Record<
 *       estree.Variable,
 *       import("./global-object/index.js").GlobalObjectKind
 *     >,
 *   },
 * ) => import("../../sequence.js").PreludeSequence<
 *   import("./index.js").GlobalObjectFrame
 * >}
 */
export const bindGlobalObjectStatic = (site, context, { record }) =>
  mapSequence(
    flatSequence(
      map(listEntry(record), ([variable, kind]) =>
        mapSequence(
          bindGlobalObject(site, context, { variable, kind }),
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
 *   context: {
 *     mode: "strict" | "sloppy",
 *   },
 *   options: {
 *     record: Record<
 *       estree.Variable,
 *       import("./global-record/index.js").GlobalRecordKind
 *     >,
 *   },
 * ) => import("../../sequence.js").PreludeSequence<
 *   import("./index.js").GlobalRecordFrame
 * >}
 */
export const bindGlobalRecordStatic = (site, context, { record }) =>
  mapSequence(
    flatSequence(
      map(listEntry(record), ([variable, kind]) =>
        mapSequence(
          bindGlobalRecord(site, context, { variable, kind }),
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
 *   context: {},
 *   options: {
 *     record: Record<
 *       estree.Variable,
 *       import("./import").ImportBinding
 *     >,
 *   },
 * ) => import("../../sequence.js").PreludeSequence<
 *   import("./index.js").ImportFrame
 * >}
 */
export const bindImport = (_site, _context, { record }) =>
  zeroSequence({
    type: "static-import",
    record,
  });

/**
 * @type {(
 *   site: {
 *     path: unbuild.Path,
 *   },
 *   context: {
 *     mode: "strict" | "sloppy",
 *   },
 *   options: {
 *     record: Record<
 *       estree.Variable,
 *       import("./regular/index.js").RegularKind
 *     >,
 *     exports: Record<estree.Variable, estree.Specifier[]>,
 *   },
 * ) => import("../../sequence.js").PreludeSequence<
 *   import("./index.js").RegularFrame
 * >}
 */
export const bindRegularStatic = (site, context, { record, exports }) =>
  mapSequence(
    flatSequence(
      map(listEntry(record), ([variable, kind]) =>
        mapSequence(
          bindRegular(site, context, { variable, kind, exports }),
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
 *   context: {
 *     mode: "strict" | "sloppy",
 *   },
 *   options: {
 *     operation: "read" | "typeof" | "discard",
 *     frame: import(".").StaticFrame,
 *     variable: estree.Variable,
 *   },
 * ) => aran.Expression<unbuild.Atom> | null}
 */
export const makeStaticLoadExpresssion = (
  site,
  context,
  { operation, frame, variable },
) => {
  if (hasOwn(frame.record, variable)) {
    switch (frame.type) {
      case "static-external": {
        return makeExternalLoadExpression(site, context, {
          operation,
          binding: frame.record[variable],
          variable,
        });
      }
      case "static-fake": {
        return makeFakeLoadExpression(site, context, {
          operation,
          binding: frame.record[variable],
          variable,
        });
      }
      case "static-global-object": {
        return makeGlobalObjectLoadExpression(site, context, {
          operation,
          binding: frame.record[variable],
          variable,
        });
      }
      case "static-global-record": {
        return makeGlobalRecordLoadExpression(site, context, {
          operation,
          binding: frame.record[variable],
          variable,
        });
      }
      case "static-import": {
        return makeImportLoadExpression(site, context, {
          operation,
          binding: frame.record[variable],
          variable,
        });
      }
      case "static-regular": {
        return makeRegularLoadExpression(site, context, {
          operation,
          binding: frame.record[variable],
          variable,
        });
      }
      default: {
        throw new AranTypeError("invalid static frame", frame);
      }
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
 *   context: {
 *     mode: "strict" | "sloppy",
 *   },
 *   options: {
 *     operation: "write" | "initialize",
 *     frame: import("./index.d.ts").StaticFrame,
 *     variable: estree.Variable,
 *     right: import("../../cache.js").Cache | null,
 *   },
 * ) => aran.Effect<unbuild.Atom>[] | null}
 */
export const listStaticSaveEffect = (
  site,
  context,
  { operation, frame, variable, right },
) => {
  if (hasOwn(frame.record, variable)) {
    switch (frame.type) {
      case "static-external": {
        return listExternalSaveEffect(site, context, {
          operation,
          binding: frame.record[variable],
          variable,
          right,
        });
      }
      case "static-fake": {
        return listFakeSaveEffect(site, context, {
          operation,
          binding: frame.record[variable],
          variable,
          right,
        });
      }
      case "static-global-object": {
        return listGlobalObjectSaveEffect(site, context, {
          operation,
          binding: frame.record[variable],
          variable,
          right,
        });
      }
      case "static-global-record": {
        return listGlobalRecordSaveEffect(site, context, {
          operation,
          binding: frame.record[variable],
          variable,
          right,
        });
      }
      case "static-import": {
        return listImportSaveEffect(site, context, {
          operation,
          binding: frame.record[variable],
          variable,
          right,
        });
      }
      case "static-regular": {
        return listRegularSaveEffect(site, context, {
          operation,
          binding: frame.record[variable],
          variable,
          right,
        });
      }
      default: {
        throw new AranTypeError("invalid static frame", frame);
      }
    }
  } else {
    return null;
  }
};
