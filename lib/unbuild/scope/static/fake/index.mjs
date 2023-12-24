import { AranTypeError } from "../../../../error.mjs";
import {
  cacheWritable,
  listWriteCacheEffect,
  makeReadCacheExpression,
} from "../../../cache.mjs";
import {
  makeBinaryExpression,
  makeUnaryExpression,
} from "../../../intrinsic.mjs";
import {
  makeConditionalEffect,
  makeConditionalExpression,
  makeExpressionEffect,
  makeIntrinsicExpression,
  makePrimitiveExpression,
} from "../../../node.mjs";
import { mapSequence } from "../../../sequence.mjs";
import {
  makeThrowConstantExpression,
  makeThrowDeadzoneExpression,
} from "../../error.mjs";

/**
 * @type {(
 *   site: {
 *     path: unbuild.Path,
 *     meta: import("../../../meta").Meta,
 *   },
 *   kind: import(".").FakeKind,
 *   options: {},
 * ) => import("../../../sequence.js").EffectSequence<
 *   import(".").FakeBinding,
 * >}
 */
export const setupFakeBinding = ({ path, meta }, kind, {}) =>
  mapSequence(
    cacheWritable(meta, makeIntrinsicExpression("aran.deadzone", path), path),
    (proxy) => ({
      kind,
      proxy,
    }),
  );

/**
 * @type {(
 *   site: {
 *     path: unbuild.Path,
 *   },
 *   binding: import(".").FakeBinding,
 *   operation: (
 *     | import("../..").InitializeOperation
 *     | import("../..").WriteOperation
 *   ),
 * ) => aran.Effect<unbuild.Atom>[]}
 */
export const listFakeSaveEffect = ({ path }, binding, operation) => {
  switch (operation.type) {
    case "initialize": {
      return listWriteCacheEffect(
        binding.proxy,
        operation.right === null
          ? makePrimitiveExpression({ undefined: null }, path)
          : makeReadCacheExpression(operation.right, path),
        path,
      );
    }
    case "write": {
      return [
        makeConditionalEffect(
          makeBinaryExpression(
            "===",
            makeReadCacheExpression(binding.proxy, path),
            makeIntrinsicExpression("aran.deadzone", path),
            path,
          ),
          [
            makeExpressionEffect(
              makeThrowDeadzoneExpression(operation.variable, path),
              path,
            ),
          ],
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
 *   binding: import(".").FakeBinding,
 *   operation: (
 *     | import("../..").ReadOperation
 *     | import("../..").TypeofOperation
 *     | import("../..").DiscardOperation
 *   ),
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeFakeLoadExpression = ({ path }, binding, operation) => {
  switch (operation.type) {
    case "read": {
      return makeConditionalExpression(
        makeBinaryExpression(
          "===",
          makeReadCacheExpression(binding.proxy, path),
          makeIntrinsicExpression("aran.deadzone", path),
          path,
        ),
        makeThrowDeadzoneExpression(operation.variable, path),
        makeReadCacheExpression(binding.proxy, path),
        path,
      );
    }
    case "typeof": {
      return makeUnaryExpression(
        "typeof",
        makeConditionalExpression(
          makeBinaryExpression(
            "===",
            makeReadCacheExpression(binding.proxy, path),
            makeIntrinsicExpression("aran.deadzone", path),
            path,
          ),
          makeThrowDeadzoneExpression(operation.variable, path),
          makeReadCacheExpression(binding.proxy, path),
          path,
        ),
        path,
      );
    }
    case "discard": {
      return makePrimitiveExpression(false, path);
    }
    default: {
      throw new AranTypeError("invalid operation", operation);
    }
  }
};
