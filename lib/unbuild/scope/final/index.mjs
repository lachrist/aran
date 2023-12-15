import { AranTypeError } from "../../../error.mjs";
import {
  listExternalSaveEffect,
  makeExternalLoadExpression,
} from "./external.mjs";
import {
  listInternalSaveEffect,
  makeInternalLoadExpression,
} from "./internal.mjs";

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
 *     frame: import("./index").FinalFrame,
 *     variable: estree.Variable,
 *   },
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeRootLoadxpression = (
  site,
  context,
  { operation, frame, variable },
) => {
  switch (frame.type) {
    case "internal": {
      return makeInternalLoadExpression(site, context, {
        operation,
        variable,
      });
    }
    case "external": {
      return makeExternalLoadExpression(site, context, {
        operation,
        variable,
      });
    }
    default: {
      throw new AranTypeError("invalid frame", frame);
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
 *     frame: import("./index").FinalFrame,
 *     variable: estree.Variable,
 *     right: import("../../cache").Cache | null,
 *   },
 * ) => aran.Effect<unbuild.Atom>[]}
 */
export const listRootSaveEffect = (
  site,
  context,
  { operation, frame, variable, right },
) => {
  switch (frame.type) {
    case "internal": {
      return listInternalSaveEffect(site, context, {
        operation,
        variable,
        right,
      });
    }
    case "external": {
      return listExternalSaveEffect(site, context, {
        operation,
        variable,
        right,
      });
    }
    default: {
      throw new AranTypeError("invalid frame", frame);
    }
  }
};
