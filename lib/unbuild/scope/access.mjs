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
 *   record: import("../cache").Cache,
 *   operation:
 *     | import(".").ReadOperation
 *     | import(".").TypeofOperation
 *     | import(".").DiscardOperation,
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeLoadExpression = ({ path }, record, operation) => {
  switch (operation.type) {
    case "read": {
      return makeGetExpression(
        makeReadCacheExpression(record, path),
        makePrimitiveExpression(operation.variable, path),
        path,
      );
    }
    case "typeof": {
      return makeUnaryExpression(
        "typeof",
        makeGetExpression(
          makeReadCacheExpression(record, path),
          makePrimitiveExpression(operation.variable, path),
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
          makeReadCacheExpression(record, path),
          makePrimitiveExpression(operation.variable, path),
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
 *   record: import("../cache").Cache,
 *   operation: (
 *     | import(".").InitializeOperation
 *     | import(".").WriteOperation
 *   ),
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeSaveExpression = ({ path }, record, operation) => {
  switch (operation.type) {
    case "initialize": {
      return makeApplyExpression(
        makeIntrinsicExpression("Reflect.defineProperty", path),
        makePrimitiveExpression({ undefined: null }, path),
        [
          makeReadCacheExpression(record, path),
          makePrimitiveExpression(operation.variable, path),
          makeDataDescriptorExpression(
            {
              value:
                operation.right === null
                  ? makePrimitiveExpression({ undefined: null }, path)
                  : makeReadCacheExpression(operation.right, path),
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
          makeReadCacheExpression(record, path),
          makePrimitiveExpression(operation.variable, path),
          makeReadCacheExpression(operation.right, path),
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
 *   record: import("../cache").Cache,
 *   operation: import(".").WriteOperation,
 * ) => aran.Effect<unbuild.Atom>[]}
 */
export const listSaveEffect = ({ path }, record, operation) => {
  switch (operation.mode) {
    case "strict": {
      return [
        makeConditionalEffect(
          makeSaveExpression({ path }, record, operation),
          [],
          [
            makeExpressionEffect(
              makeThrowConstantExpression(operation.variable, path),
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
          makeSaveExpression({ path }, record, operation),
          path,
        ),
      ];
    }
    default: {
      throw new AranTypeError("invalid operation.mode", operation.mode);
    }
  }
};
