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
 *   frame: import(".").DynamicFrame,
 *   operation: import("..").ExpressionOperation,
 *   alternate: aran.Expression<unbuild.Atom>,
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeDynamicLoadExpresssion = (
  site,
  frame,
  operation,
  alternate,
) => {
  if (
    operation.type === "read" ||
    operation.type === "typeof" ||
    operation.type === "discard"
  ) {
    switch (frame.type) {
      case "dynamic-global-object": {
        return makeGlobalObjectLoadExpression(
          site,
          frame,
          operation,
          alternate,
        );
      }
      case "dynamic-global-record": {
        return makeGlobalRecordLoadExpression(
          site,
          frame,
          operation,
          alternate,
        );
      }
      case "dynamic-with": {
        return makeWithLoadExpression(site, frame, operation, alternate);
      }
      default: {
        throw new AranTypeError("invalid dynamic frame", frame);
      }
    }
  } else {
    return alternate;
  }
};

/**
 * @type {(
 *   site: {
 *     path: unbuild.Path,
 *     meta: unbuild.Meta,
 *   },
 *   frame: import(".").DynamicFrame,
 *   operation: import("..").EffectOperation,
 *   alternate: aran.Effect<unbuild.Atom>[],
 * ) => aran.Effect<unbuild.Atom>[]}
 */
export const listDynamicSaveEffect = (site, frame, operation, alternate) => {
  if (operation.type === "write") {
    switch (frame.type) {
      case "dynamic-global-object": {
        return listGlobalObjectSaveEffect(site, frame, operation, alternate);
      }
      case "dynamic-global-record": {
        return listGlobalRecordSaveEffect(site, frame, operation, alternate);
      }
      case "dynamic-with": {
        return listWithSaveEffect(site, frame, operation, alternate);
      }
      default: {
        throw new AranTypeError("invalid dynamic frame", frame);
      }
    }
  } else {
    return alternate;
  }
};
