import { AranTypeError } from "../../../error.mjs";
import { flatMap, hasOwn, listEntry } from "../../../util/index.mjs";
import {
  listBlockSaveEffect,
  listBlockVariable,
  makeBlockLoadExpression,
} from "./block.mjs";
import {
  listExternalHeader,
  listExternalLog,
  listExternalSaveEffect,
  makeExternalLoadExpression,
} from "./external.mjs";
import { listFakeSaveEffect, makeFakeLoadExpression } from "./fake.mjs";
import {
  listGlobalObjectDeclareEffect,
  listGlobalObjectPreludeEffect,
  listGlobalObjectSaveEffect,
  makeGlobalObjectLoadExpression,
} from "./global-object.mjs";
import {
  listGlobalRecordDeclareEffect,
  listGlobalRecordPreludeEffect,
  listGlobalRecordSaveEffect,
  makeGlobalRecordLoadExpression,
} from "./global-record.mjs";
import { listImportSaveEffect, makeImportLoadExpression } from "./import.mjs";

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
 *     frame: import("./index.js").StaticFrame,
 *   },
 * ) => unbuild.Variable[]}
 */
export const listStaticVariable = (site, context, { frame }) => {
  if (frame.type === "block") {
    return flatMap(listEntry(frame.record), ([variable, binding]) =>
      listBlockVariable(site, context, { binding, variable }),
    );
  } else {
    return [];
  }
};

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
 *     frame: import("./index.js").StaticFrame,
 *   },
 * ) => import("../../../../type/unbuild.js").Log[]}
 */
export const listStaticLog = (site, context, { frame }) => {
  if (frame.type === "external") {
    return flatMap(listEntry(frame.record), ([variable, binding]) =>
      listExternalLog(site, context, { binding, variable }),
    );
  } else {
    return [];
  }
};

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
 *     frame: import("./index.js").StaticFrame,
 *   },
 * ) => import("../../../header.js").Header[]}
 */
export const listStaticHeader = (site, context, { frame }) => {
  if (frame.type === "external") {
    return flatMap(listEntry(frame.record), ([variable, binding]) =>
      listExternalHeader(site, context, { binding, variable }),
    );
  } else {
    return [];
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
 *     frame: import("./index.js").StaticFrame,
 *   },
 * ) => aran.Effect<unbuild.Atom>[]}
 */
export const listStaticPreludeEffect = (site, context, { frame }) => {
  if (frame.type === "global-object") {
    return flatMap(listEntry(frame.record), ([variable, binding]) =>
      listGlobalObjectPreludeEffect(site, context, { binding, variable }),
    );
  } else if (frame.type === "global-record") {
    return flatMap(listEntry(frame.record), ([variable, binding]) =>
      listGlobalRecordPreludeEffect(site, context, {
        binding,
        variable,
      }),
    );
  } else {
    return [];
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
 *     frame: import("./index.js").StaticFrame,
 *   },
 * ) => aran.Effect<unbuild.Atom>[]}
 */
export const listStaticDeclareEffect = (site, context, { frame }) => {
  if (frame.type === "global-object") {
    return flatMap(listEntry(frame.record), ([variable, binding]) =>
      listGlobalObjectDeclareEffect(site, context, { binding, variable }),
    );
  } else if (frame.type === "global-record") {
    return flatMap(listEntry(frame.record), ([variable, binding]) =>
      listGlobalRecordDeclareEffect(site, context, {
        binding,
        variable,
      }),
    );
  } else {
    return [];
  }
};

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
 *     operation: "read" | "typeof" | "discard",
 *     frame: import("./index.js").StaticFrame,
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
      case "import": {
        return makeImportLoadExpression(site, context, {
          operation,
          binding: frame.record[variable],
          variable,
        });
      }
      case "block": {
        return makeBlockLoadExpression(site, context, {
          operation,
          binding: frame.record[variable],
          variable,
        });
      }
      case "fake": {
        return makeFakeLoadExpression(site, context, {
          operation,
          binding: frame.record[variable],
          variable,
        });
      }
      case "external": {
        return makeExternalLoadExpression(site, context, {
          operation,
          binding: frame.record[variable],
          variable,
        });
      }
      case "global-object": {
        return makeGlobalObjectLoadExpression(site, context, {
          operation,
          binding: frame.record[variable],
          variable,
        });
      }
      case "global-record": {
        return makeGlobalRecordLoadExpression(site, context, {
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
 *     meta: unbuild.Meta,
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
      case "import": {
        return listImportSaveEffect(site, context, {
          operation,
          binding: frame.record[variable],
          variable,
          right,
        });
      }
      case "block": {
        return listBlockSaveEffect(site, context, {
          operation,
          binding: frame.record[variable],
          variable,
          right,
        });
      }
      case "fake": {
        return listFakeSaveEffect(site, context, {
          operation,
          binding: frame.record[variable],
          variable,
          right,
        });
      }
      case "external": {
        return listExternalSaveEffect(site, context, {
          operation,
          binding: frame.record[variable],
          variable,
          right,
        });
      }
      case "global-object": {
        return listGlobalObjectSaveEffect(site, context, {
          operation,
          binding: frame.record[variable],
          variable,
          right,
        });
      }
      case "global-record": {
        return listGlobalRecordSaveEffect(site, context, {
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
