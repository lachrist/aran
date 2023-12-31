import { AranTypeError } from "../../../error.mjs";
import { pairup, hasOwn, reduceEntry, map } from "../../../util/index.mjs";
import {
  cacheWritable,
  listWriteCacheEffect,
  makeReadCacheExpression,
} from "../../cache.mjs";
import { makeBinaryExpression, makeUnaryExpression } from "../../intrinsic.mjs";
import { forkMeta, nextMeta } from "../../meta.mjs";
import {
  makeConditionalEffect,
  makeConditionalExpression,
  makeExpressionEffect,
  makeIntrinsicExpression,
  makePrimitiveExpression,
} from "../../node.mjs";
import { flatSequence, mapSequence } from "../../sequence.mjs";
import {
  makeThrowConstantExpression,
  makeThrowDeadzoneExpression,
} from "../error.mjs";

/**
 * @type {(
 *   site: {
 *     path: unbuild.Path,
 *     meta: import("../../meta").Meta,
 *   },
 *   kind: import(".").FakeKind,
 *   options: {},
 * ) => import("../../sequence.js").EffectSequence<
 *   import(".").FakeBinding,
 * >}
 */
const setupBinding = ({ path, meta }, kind, {}) =>
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
 *     meta: import("../../meta").Meta,
 *   },
 *   options: {
 *     entries: [
 *       estree.Variable,
 *       import("../fake").FakeKind
 *      ][],
 *   },
 * ) => import("../../sequence.js").EffectSequence<
 *   import(".").FakeFrame
 * >}
 */
export const setupFakeFrame = ({ path, meta }, { entries }) =>
  mapSequence(
    flatSequence(
      map(entries, ([variable, kind]) =>
        mapSequence(
          setupBinding(
            { path, meta: forkMeta((meta = nextMeta(meta))) },
            kind,
            {},
          ),
          (binding) => pairup(variable, binding),
        ),
      ),
    ),
    (entries) => ({
      type: "fake",
      record: reduceEntry(entries),
    }),
  );

/**
 * @type {(
 *   site: {
 *     path: unbuild.Path,
 *   },
 *   binding: import(".").FakeBinding,
 *   operation: (
 *     | import("..").InitializeOperation
 *     | import("..").WriteOperation
 *   ),
 * ) => aran.Effect<unbuild.Atom>[]}
 */
const listBindingSaveEffect = ({ path }, binding, operation) => {
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
 *   frame: import(".").FakeFrame,
 *   operation: (
 *     | import("..").InitializeOperation
 *     | import("..").WriteOperation
 *   ),
 * ) => aran.Effect<unbuild.Atom>[] | null}
 */
export const listFakeSaveEffect = ({ path }, frame, operation) => {
  if (hasOwn(frame.record, operation.variable)) {
    return listBindingSaveEffect(
      { path },
      frame.record[operation.variable],
      operation,
    );
  } else {
    return null;
  }
};

/**
 * @type {(
 *   site: {
 *     path: unbuild.Path,
 *   },
 *   binding: import(".").FakeBinding,
 *   operation: (
 *     | import("..").ReadOperation
 *     | import("..").TypeofOperation
 *     | import("..").DiscardOperation
 *   ),
 * ) => aran.Expression<unbuild.Atom>}
 */
const makeBindingLoadExpression = ({ path }, binding, operation) => {
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

/**
 * @type {(
 *   site: {
 *     path: unbuild.Path,
 *   },
 *   frame: import(".").FakeFrame,
 *   operation: (
 *     | import("..").ReadOperation
 *     | import("..").TypeofOperation
 *     | import("..").DiscardOperation
 *   ),
 * ) => aran.Expression<unbuild.Atom> | null}
 */
export const listFakeLoadExpression = ({ path }, frame, operation) => {
  if (hasOwn(frame.record, operation.variable)) {
    return makeBindingLoadExpression(
      { path },
      frame.record[operation.variable],
      operation,
    );
  } else {
    return null;
  }
};
