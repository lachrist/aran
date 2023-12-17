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
 *     meta: unbuild.Meta,
 *   },
 *   context: {},
 *   options: {
 *     kind: import(".").FakeKind,
 *     variable: estree.Variable,
 *   },
 * ) => import("../../../sequence.js").EffectSequence<
 *   import(".").FakeBinding,
 * >}
 */
export const bindFake = ({ path, meta }, _context, { kind }) =>
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
 *   context: {},
 *   options: {
 *     operation: "initialize" | "write",
 *     binding: import(".").FakeBinding,
 *     variable: estree.Variable,
 *     right: import("../../../cache.js").Cache| null,
 *   },
 * ) => aran.Effect<unbuild.Atom>[]}
 */
export const listFakeSaveEffect = (
  { path },
  _context,
  { operation, binding, variable, right },
) => {
  switch (operation) {
    case "initialize": {
      return listWriteCacheEffect(
        binding.proxy,
        right === null
          ? makePrimitiveExpression({ undefined: null }, path)
          : makeReadCacheExpression(right, path),
        path,
      );
    }
    case "write": {
      if (right === null) {
        return [];
      } else {
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
                makeThrowDeadzoneExpression(variable, path),
                path,
              ),
            ],
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
 *     operation: "read" | "typeof" | "discard",
 *     binding: import(".").FakeBinding,
 *     variable: estree.Variable,
 *   },
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeFakeLoadExpression = (
  { path },
  _context,
  { operation, binding, variable },
) => {
  switch (operation) {
    case "read": {
      return makeConditionalExpression(
        makeBinaryExpression(
          "===",
          makeReadCacheExpression(binding.proxy, path),
          makeIntrinsicExpression("aran.deadzone", path),
          path,
        ),
        makeThrowDeadzoneExpression(variable, path),
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
          makeThrowDeadzoneExpression(variable, path),
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
