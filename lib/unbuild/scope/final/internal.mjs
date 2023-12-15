import { AranTypeError } from "../../../error.mjs";
import { makeReadCacheExpression } from "../../cache.mjs";
import {
  makeApplyExpression,
  makeExpressionEffect,
  makeIntrinsicExpression,
  makePrimitiveExpression,
} from "../../node.mjs";
import { makeThrowMissingExpression } from "../error.mjs";

/**
 * @type {(
 *   site: {
 *     path: unbuild.Path,
 *   },
 *   context: {
 *     mode: "strict" | "sloppy",
 *   },
 *   options: {
 *     operation: "write",
 *     variable: estree.Variable,
 *     right: import("../../cache").Cache | null,
 *   },
 * ) => aran.Effect<unbuild.Atom>[]}
 */
export const listInternalSaveEffect = (
  { path },
  context,
  { variable, right },
) => {
  if (right === null) {
    return [];
  } else {
    switch (context.mode) {
      case "sloppy": {
        return [
          makeExpressionEffect(
            makeApplyExpression(
              makeIntrinsicExpression("Reflect.set", path),
              makePrimitiveExpression({ undefined: null }, path),
              [
                makeIntrinsicExpression("aran.global", path),
                makePrimitiveExpression(variable, path),
                makeReadCacheExpression(right, path),
              ],
              path,
            ),
            path,
          ),
        ];
      }
      case "strict": {
        return [
          makeExpressionEffect(
            makeThrowMissingExpression(variable, path),
            path,
          ),
        ];
      }
      default: {
        throw new AranTypeError("invalid mode", context.mode);
      }
    }
  }
};

/**
 * @type {(
 *   site: {
 *     path: unbuild.Path,
 *   },
 *   context: {},
 *   options: {
 *     operation: "read" | "typeof" | "discard",
 *     variable: estree.Variable,
 *   },
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeInternalLoadExpression = (
  { path },
  _context,
  { operation, variable },
) => {
  switch (operation) {
    case "read": {
      return makeThrowMissingExpression(variable, path);
    }
    case "typeof": {
      return makePrimitiveExpression("undefined", path);
    }
    case "discard": {
      return makePrimitiveExpression(true, path);
    }
    default: {
      throw new AranTypeError("invalid load operation", operation);
    }
  }
};
