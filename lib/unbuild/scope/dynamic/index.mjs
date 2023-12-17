import { AranTypeError } from "../../../error.mjs";
import {
  listGlobalObjectSaveEffect,
  makeGlobalObjectLoadExpression,
} from "./global-object.mjs";
import {
  listGlobalRecordSaveEffect,
  makeGlobalRecordLoadExpression,
} from "./global-record.mjs";
import { listWithSaveEffect, makeWithLoadExpression } from "./with.mjs";

/** @type {Record<import(".").DynamicFrame["type"], null>} */
export const DYNAMIC = {
  "dynamic-global-object": null,
  "dynamic-global-record": null,
  "dynamic-with": null,
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
 *     frame: import("./index.d.ts").DynamicFrame,
 *     variable: estree.Variable,
 *     alternate: aran.Expression<unbuild.Atom>,
 *   },
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeDynamicLoadExpresssion = (
  site,
  context,
  { operation, frame, variable, alternate },
) => {
  switch (frame.type) {
    case "dynamic-global-object": {
      return makeGlobalObjectLoadExpression(site, context, {
        operation,
        record: frame.record,
        variable,
        alternate,
      });
    }
    case "dynamic-global-record": {
      return makeGlobalRecordLoadExpression(site, context, {
        operation,
        record: frame.record,
        variable,
        alternate,
      });
    }
    case "dynamic-with": {
      return makeWithLoadExpression(site, context, {
        operation,
        record: frame.record,
        variable,
        alternate,
      });
    }
    default: {
      throw new AranTypeError("invalid dynamic frame", frame);
    }
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
 *     operation: "write",
 *     frame: import("./index.d.ts").DynamicFrame,
 *     variable: estree.Variable,
 *     right: import("../../cache.js").Cache | null,
 *     alternate: aran.Effect<unbuild.Atom>[],
 *   },
 * ) => aran.Effect<unbuild.Atom>[]}
 */
export const listDynamicSaveEffect = (
  site,
  context,
  { operation, frame, variable, right, alternate },
) => {
  switch (frame.type) {
    case "dynamic-global-object": {
      return listGlobalObjectSaveEffect(site, context, {
        operation,
        record: frame.record,
        variable,
        right,
        alternate,
      });
    }
    case "dynamic-global-record": {
      return listGlobalRecordSaveEffect(site, context, {
        operation,
        record: frame.record,
        variable,
        right,
        alternate,
      });
    }
    case "dynamic-with": {
      return listWithSaveEffect(site, context, {
        operation,
        record: frame.record,
        variable,
        right,
        alternate,
      });
    }
    default: {
      throw new AranTypeError("invalid dynamic frame", frame);
    }
  }
};
