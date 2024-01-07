import { AranTypeError } from "../../../error.mjs";
import { pairup, hasOwn, reduceEntry, map } from "../../../util/index.mjs";
import {
  cacheWritable,
  listWriteCacheEffect,
  makeReadCacheExpression,
} from "../../cache.mjs";
import { listEarlyErrorEffect } from "../../early-error.mjs";
import { makeBinaryExpression, makeUnaryExpression } from "../../intrinsic.mjs";
import { forkMeta, nextMeta } from "../../meta.mjs";
import {
  EMPTY_EFFECT,
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
  reportDuplicate,
} from "../error.mjs";

/**
 * @type {(
 *   site: import("../../site").VoidSite,
 *   kind: import(".").FakeKind,
 * ) => import("../../sequence").ExpressionSequence}
 */
const makeInitialExpression = ({ path }, kind) => {
  if (kind === "var" || kind === "val") {
    return makePrimitiveExpression({ undefined: null }, path);
  } else if (kind === "let" || kind === "const") {
    return makeIntrinsicExpression("aran.deadzone", path);
  } else {
    throw new AranTypeError(kind);
  }
};

/**
 * @type {(
 *   site: import("../../site").LeafSite,
 *   hoist: import(".").FakeHoist,
 * ) => import("../../sequence").Sequence<
 *   import("../../prelude").NodePrelude,
 *   [
 *     estree.Variable,
 *     import(".").FakeBinding,
 *   ],
 * >}
 */
const setupBinding = ({ path, meta }, { variable, kind }) =>
  mapSequence(
    cacheWritable(meta, makeInitialExpression({ path }, kind), path),
    (proxy) =>
      pairup(variable, {
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
 *   hoisting: import(".").FakeHoist[],
 * ) => import("../../sequence").Sequence<
 *   import("../../prelude").NodePrelude,
 *   import(".").FakeFrame
 * >}
 */
export const setupFakeFrame = ({ path, meta }, entries) =>
  mapSequence(
    flatSequence(
      map(entries, (entry) =>
        setupBinding({ path, meta: forkMeta((meta = nextMeta(meta))) }, entry),
      ),
    ),
    (entries) => ({
      type: "fake",
      record: reduceEntry(entries),
    }),
  );

/**
 * @type {(
 *   site: import("../../site").VoidSite,
 *   binding: import(".").FakeBinding,
 *   operation: import("..").VariableSaveOperation,
 * ) => import("../../sequence").EffectSequence}
 */
const listBindingSaveEffect = ({ path }, binding, operation) => {
  switch (operation.type) {
    case "initialize": {
      if (binding.kind !== operation.kind) {
        return listEarlyErrorEffect(reportDuplicate(operation.variable), path);
      } else {
        if (binding.kind === "let" || binding.kind === "const") {
          return listWriteCacheEffect(
            binding.proxy,
            operation.right === null
              ? makePrimitiveExpression({ undefined: null }, path)
              : makeReadCacheExpression(operation.right, path),
            path,
          );
        } else if (binding.kind === "var" || binding.kind === "val") {
          if (operation.right === null) {
            return EMPTY_EFFECT;
          } else {
            return listWriteCacheEffect(
              binding.proxy,
              makeReadCacheExpression(operation.right, path),
              path,
            );
          }
        } else {
          throw new AranTypeError(binding.kind);
        }
      }
    }
    case "write": {
      if (binding.kind === "let" || binding.kind === "const") {
        return makeConditionalEffect(
          makeBinaryExpression(
            "===",
            makeReadCacheExpression(binding.proxy, path),
            makeIntrinsicExpression("aran.deadzone", path),
            path,
          ),
          binding.kind === "const"
            ? makeExpressionEffect(
                makeThrowDeadzoneExpression(operation.variable, path),
                path,
              )
            : listWriteCacheEffect(
                binding.proxy,
                makeReadCacheExpression(operation.right, path),
                path,
              ),
          makeExpressionEffect(
            makeThrowConstantExpression(operation.variable, path),
            path,
          ),
          path,
        );
      } else if (binding.kind === "var") {
        return listWriteCacheEffect(
          binding.proxy,
          makeReadCacheExpression(operation.right, path),
          path,
        );
      } else if (binding.kind === "val") {
        if (operation.mode === "strict") {
          return makeExpressionEffect(
            makeThrowConstantExpression(operation.variable, path),
            path,
          );
        } else if (operation.mode === "sloppy") {
          return EMPTY_EFFECT;
        } else {
          throw new AranTypeError(operation.mode);
        }
      } else {
        throw new AranTypeError(binding.kind);
      }
    }
    default: {
      throw new AranTypeError(operation);
    }
  }
};

/**
 * @type {(
 *   site: import("../../site").VoidSite,
 *   frame: import(".").FakeFrame,
 *   operation: import("..").VariableSaveOperation
 * ) => null | import("../../sequence.js").EffectSequence}
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
 *   site: import("../../site").VoidSite,
 *   binding: import(".").FakeBinding,
 *   operation: import("..").VariableLoadOperation,
 * ) => import("../../sequence").ExpressionSequence}
 */
const makeBindingLoadExpression = ({ path }, binding, operation) => {
  switch (operation.type) {
    case "read": {
      if (binding.kind === "let" || binding.kind === "const") {
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
      } else if (binding.kind === "var" || binding.kind === "val") {
        return makeReadCacheExpression(binding.proxy, path);
      } else {
        throw new AranTypeError(binding.kind);
      }
    }
    case "typeof": {
      if (binding.kind === "let" || binding.kind === "const") {
        return makeConditionalExpression(
          makeBinaryExpression(
            "===",
            makeReadCacheExpression(binding.proxy, path),
            makeIntrinsicExpression("aran.deadzone", path),
            path,
          ),
          makeThrowDeadzoneExpression(operation.variable, path),
          makeUnaryExpression(
            "typeof",
            makeReadCacheExpression(binding.proxy, path),
            path,
          ),
          path,
        );
      } else if (binding.kind === "var" || binding.kind === "val") {
        return makeUnaryExpression(
          "typeof",
          makeReadCacheExpression(binding.proxy, path),
          path,
        );
      } else {
        throw new AranTypeError(binding.kind);
      }
    }
    case "discard": {
      return makePrimitiveExpression(false, path);
    }
    default: {
      throw new AranTypeError(operation);
    }
  }
};

/**
 * @type {(
 *   site: import("../../site").VoidSite,
 *   frame: import(".").FakeFrame,
 *   operation: import("..").VariableLoadOperation,
 * ) => import("../../sequence").ExpressionSequence | null}
 */
export const makeFakeLookupExpression = ({ path }, frame, operation) => {
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
