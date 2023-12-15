import { AranTypeError } from "../../error.mjs";
import { makeReadCacheExpression } from "../cache.mjs";
import {
  makeGetExpression,
  makeUnaryExpression,
  makeDataDescriptorExpression,
} from "../intrinsic.mjs";
import {
  makeApplyExpression,
  makeConditionalEffect,
  makeExpressionEffect,
  makeIntrinsicExpression,
  makePrimitiveExpression,
} from "../node.mjs";
import { makeThrowConstantExpression } from "./error.mjs";

/**
 * @type {(
 *   site: {
 *     path: unbuild.Path,
 *   },
 *   context: {},
 *   options: {
 *     operation:  "read" | "typeof" | "discard",
 *     frame: import("../cache").Cache,
 *     variable: estree.Variable,
 *   },
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeLoadExpression = (
  { path },
  _context,
  { operation, frame, variable },
) => {
  switch (operation) {
    case "read": {
      return makeGetExpression(
        makeReadCacheExpression(frame, path),
        makePrimitiveExpression(variable, path),
        path,
      );
    }
    case "typeof": {
      return makeUnaryExpression(
        "typeof",
        makeGetExpression(
          makeReadCacheExpression(frame, path),
          makePrimitiveExpression(variable, path),
          path,
        ),
        path,
      );
    }
    case "discard": {
      return makeApplyExpression(
        makeIntrinsicExpression("Reflect.deleteProperty", path),
        makePrimitiveExpression({ undefined: null }, path),
        [
          makeReadCacheExpression(frame, path),
          makePrimitiveExpression(variable, path),
        ],
        path,
      );
    }
    default: {
      throw new AranTypeError("invalid load operation", operation);
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
 *     operation: "initialize" | "write",
 *     frame: import("../cache").Cache,
 *     variable: estree.Variable,
 *     right: import("../cache").Cache,
 *   },
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeSaveExpression = (
  { path },
  _context,
  { operation, frame, variable, right },
) => {
  switch (operation) {
    case "initialize": {
      return makeApplyExpression(
        makeIntrinsicExpression("Reflect.defineProperty", path),
        makePrimitiveExpression({ undefined: null }, path),
        [
          makeReadCacheExpression(frame, path),
          makePrimitiveExpression(variable, path),
          makeDataDescriptorExpression(
            {
              value: makeReadCacheExpression(right, path),
              writable: null,
              configurable: null,
              enumerable: null,
            },
            path,
          ),
        ],
        path,
      );
    }
    case "write": {
      return makeApplyExpression(
        makeIntrinsicExpression("Reflect.set", path),
        makePrimitiveExpression({ undefined: null }, path),
        [
          makeReadCacheExpression(frame, path),
          makePrimitiveExpression(variable, path),
          makeReadCacheExpression(right, path),
        ],
        path,
      );
    }
    default: {
      throw new AranTypeError("invalid save operation", operation);
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
 *     mode: "sloppy" | "strict",
 *     operation: "initialize" | "write",
 *     frame: import("../cache").Cache,
 *     variable: estree.Variable,
 *     right: import("../cache").Cache,
 *   },
 * ) => aran.Effect<unbuild.Atom>[]}
 */
export const listSaveEffect = (
  { path },
  context,
  { mode, operation, frame, variable, right },
) => {
  switch (mode) {
    case "strict": {
      return [
        makeConditionalEffect(
          makeSaveExpression({ path }, context, {
            operation,
            frame,
            variable,
            right,
          }),
          [],
          [
            makeExpressionEffect(
              makeThrowConstantExpression(variable, path),
              path,
            ),
          ],
          path,
        ),
      ];
    }
    case "sloppy": {
      return [
        makeExpressionEffect(
          makeSaveExpression({ path }, context, {
            operation,
            frame,
            variable,
            right,
          }),
          path,
        ),
      ];
    }
    default: {
      throw new AranTypeError("invalid mode", mode);
    }
  }
};
