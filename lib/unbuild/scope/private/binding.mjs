import { AranError, AranTypeError } from "../../../error.mjs";
import {
  cacheConstant,
  cacheWritable,
  listWriteCacheEffect,
  makeReadCacheExpression,
} from "../../cache.mjs";
import { makeIsProperObjectExpression } from "../../helper.mjs";
import {
  makeBinaryExpression,
  makeThrowErrorExpression,
} from "../../intrinsic.mjs";
import {
  makeApplyExpression,
  makeConditionalEffect,
  makeConditionalExpression,
  makeConstructExpression,
  makeExpressionEffect,
  makeIntrinsicExpression,
  makePrimitiveExpression,
} from "../../node.mjs";
import { mapSequence } from "../../sequence.mjs";

/**
 * @type {(
 *   site: {
 *     path: unbuild.Path,
 *   },
 *   binding: import(".").PrivateBinding,
 *   operation: (
 *     | import("..").HasPrivateOperation
 *     | import("..").GetPrivateOperation
 *     | import("..").SetPrivateOperation
 *   ),
 * ) => import("../../sequence").ExpressionSequence}
 */
const makeAllowExpression = ({ path }, binding, operation) => {
  if (binding.type === "collection-property") {
    return makeApplyExpression(
      makeIntrinsicExpression("WeakMap.prototype.has", path),
      makeReadCacheExpression(binding.weakmap, path),
      [makeReadCacheExpression(operation.target, path)],
      path,
    );
  } else if (
    binding.type === "collection-method" ||
    binding.type === "collection-accessor"
  ) {
    return makeApplyExpression(
      makeIntrinsicExpression("WeakSet.prototype.has", path),
      makeReadCacheExpression(binding.weakset, path),
      [makeReadCacheExpression(operation.target, path)],
      path,
    );
  } else if (binding.type === "singleton-property") {
    return makeConditionalExpression(
      makeBinaryExpression(
        "===",
        makeReadCacheExpression(operation.target, path),
        makeReadCacheExpression(binding.target, path),
        path,
      ),
      makeBinaryExpression(
        "!==",
        makeReadCacheExpression(binding.value, path),
        makeIntrinsicExpression("aran.deadzone", path),
        path,
      ),
      makePrimitiveExpression(false, path),
      path,
    );
  } else if (
    binding.type === "singleton-method" ||
    binding.type === "singleton-accessor"
  ) {
    return makeBinaryExpression(
      "===",
      makeReadCacheExpression(operation.target, path),
      makeReadCacheExpression(binding.target, path),
      path,
    );
  } else {
    throw new AranTypeError(binding);
  }
};

const KINDS = {
  "collection-getter": /** @type {"collection-accessor"} */ (
    "collection-accessor"
  ),
  "collection-setter": /** @type {"collection-accessor"} */ (
    "collection-accessor"
  ),
  "singleton-getter": /** @type {"singleton-accessor"} */ (
    "singleton-accessor"
  ),
  "singleton-setter": /** @type {"singleton-accessor"} */ (
    "singleton-accessor"
  ),
};

/**
 * @type {(
 *   site: import("../../site").LeafSite,
 *   kind: import(".").PrivateKind,
 * ) => import("../../sequence").Sequence<
 *   import("../../prelude").NodePrelude,
 *   import(".").DryPrivateBinding,
 * >}
 */
export const setupBinding = ({ path, meta }, kind) => {
  if (kind === "singleton-property") {
    return mapSequence(
      cacheWritable(meta, makeIntrinsicExpression("aran.deadzone", path), path),
      (value) => ({
        type: "singleton-property",
        value,
      }),
    );
  } else if (kind === "collection-property") {
    return mapSequence(
      cacheConstant(
        meta,
        makeConstructExpression(
          makeIntrinsicExpression("WeakMap", path),
          [],
          path,
        ),
        path,
      ),
      (weakmap) => ({
        type: "collection-property",
        weakmap,
      }),
    );
  } else if (kind === "collection-method" || kind === "singleton-method") {
    return mapSequence(
      cacheWritable(meta, makeIntrinsicExpression("aran.deadzone", path), path),
      (method) => ({
        type: kind,
        method,
      }),
    );
  } else if (kind === "collection-getter" || kind === "singleton-getter") {
    return mapSequence(
      cacheWritable(meta, makeIntrinsicExpression("aran.deadzone", path), path),
      (getter) => ({
        type: KINDS[kind],
        getter,
        setter: null,
      }),
    );
  } else if (kind === "collection-setter" || kind === "singleton-setter") {
    return mapSequence(
      cacheWritable(meta, makeIntrinsicExpression("aran.deadzone", path), path),
      (setter) => ({
        type: KINDS[kind],
        getter: null,
        setter,
      }),
    );
  } else {
    throw new AranError("invalid private binding kind", kind);
  }
};

/**
 * @type {(
 *   site: import("../../site").VoidSite,
 *   binding: import(".").PrivateBinding,
 *   operation: import("..").PrivateLoadOperation
 * ) => import("../../sequence").ExpressionSequence}
 */
export const makeBindingLoadExpression = ({ path }, binding, operation) => {
  if (operation.type === "get-private") {
    if (
      binding.type === "singleton-accessor" ||
      binding.type === "collection-accessor"
    ) {
      if (binding.getter === null) {
        return makeThrowErrorExpression(
          "TypeError",
          `Cannot get private accessor #${operation.key}`,
          path,
        );
      } else {
        return makeConditionalExpression(
          makeAllowExpression({ path }, binding, operation),
          makeApplyExpression(
            makeReadCacheExpression(binding.getter, path),
            makeReadCacheExpression(operation.target, path),
            [],
            path,
          ),
          makeThrowErrorExpression(
            "TypeError",
            `Cannot get private accessor #${operation.key}`,
            path,
          ),
          path,
        );
      }
    } else if (
      binding.type === "singleton-method" ||
      binding.type === "collection-method"
    ) {
      return makeConditionalExpression(
        makeAllowExpression({ path }, binding, operation),
        makeReadCacheExpression(binding.method, path),
        makeThrowErrorExpression(
          "TypeError",
          `Cannot get private accessor #${operation.key}`,
          path,
        ),
        path,
      );
    } else if (binding.type === "collection-property") {
      return makeConditionalExpression(
        makeAllowExpression({ path }, binding, operation),
        makeApplyExpression(
          makeIntrinsicExpression("WeakMap.prototype.get", path),
          makeReadCacheExpression(binding.weakmap, path),
          [makeReadCacheExpression(operation.target, path)],
          path,
        ),
        makeThrowErrorExpression(
          "TypeError",
          `Cannot get private property #${operation.key}`,
          path,
        ),
        path,
      );
    } else if (binding.type === "singleton-property") {
      return makeConditionalExpression(
        makeAllowExpression({ path }, binding, operation),
        makeReadCacheExpression(binding.value, path),
        makeThrowErrorExpression(
          "TypeError",
          `Cannot get private property #${operation.key}`,
          path,
        ),
        path,
      );
    } else {
      throw new AranTypeError(binding);
    }
  } else if (operation.type === "has-private") {
    return makeConditionalExpression(
      makeIsProperObjectExpression({ path }, { value: operation.target }),
      makeAllowExpression({ path }, binding, operation),
      makeThrowErrorExpression(
        "TypeError",
        "Cannot query private property of non-object",
        path,
      ),
      path,
    );
  } else {
    throw new AranTypeError(operation);
  }
};

/**
 * @type {(
 *   site: import("../../site").VoidSite,
 *   binding: import(".").PrivateBinding,
 *   operation: (
 *     | import("..").DefinePrivateOperation
 *     | import("..").InitializePrivateOperation
 *     | import("..").SetPrivateOperation
 *   ),
 * ) => import("../../sequence").EffectSequence}
 */
export const listBindingSaveEffect = ({ path }, binding, operation) => {
  if (operation.type === "define-private") {
    if (binding.type === "collection-property") {
      return makeConditionalEffect(
        makeApplyExpression(
          makeIntrinsicExpression("WeakMap.prototype.has", path),
          makeReadCacheExpression(binding.weakmap, path),
          [makeReadCacheExpression(operation.target, path)],
          path,
        ),
        makeExpressionEffect(
          makeThrowErrorExpression(
            "TypeError",
            `Duplicate definition of private property #${operation.key}`,
            path,
          ),
          path,
        ),
        makeExpressionEffect(
          makeApplyExpression(
            makeIntrinsicExpression("WeakMap.prototype.set", path),
            makeReadCacheExpression(binding.weakmap, path),
            [
              makeReadCacheExpression(operation.target, path),
              makeReadCacheExpression(operation.value, path),
            ],
            path,
          ),
          path,
        ),
        path,
      );
    } else if (binding.type === "singleton-property") {
      return makeConditionalEffect(
        makeBinaryExpression(
          "!==",
          makeReadCacheExpression(binding.value, path),
          makeIntrinsicExpression("aran.deadzone", path),
          path,
        ),
        makeExpressionEffect(
          makeThrowErrorExpression(
            "TypeError",
            `Duplicate definition of private property #${operation.key}`,
            path,
          ),
          path,
        ),
        listWriteCacheEffect(
          binding.value,
          makeReadCacheExpression(operation.value, path),
          path,
        ),
        path,
      );
    } else if (
      binding.type === "collection-method" ||
      binding.type === "singleton-method" ||
      binding.type === "collection-accessor" ||
      binding.type === "singleton-accessor"
    ) {
      throw new AranError("cannot define method|accessor binding", binding);
    } else {
      throw new AranTypeError(binding);
    }
  } else if (operation.type === "initialize-private") {
    if (
      binding.type === "singleton-method" ||
      binding.type === "collection-method"
    ) {
      if (operation.kind === "method") {
        return listWriteCacheEffect(
          binding.method,
          makeReadCacheExpression(operation.value, path),
          path,
        );
      } else if (operation.kind === "getter" || operation.kind === "setter") {
        throw new AranError("initialize method kind mismatch", {
          binding,
          operation,
        });
      } else {
        throw new AranTypeError(operation.kind);
      }
    } else if (
      binding.type === "singleton-accessor" ||
      binding.type === "collection-accessor"
    ) {
      if (operation.kind === "getter" || operation.kind === "setter") {
        const cache = binding[operation.kind];
        if (cache === null) {
          throw new AranError("cannot initialize missing accessor", {
            binding,
            operation,
          });
        } else {
          return listWriteCacheEffect(
            cache,
            makeReadCacheExpression(operation.value, path),
            path,
          );
        }
      } else if (operation.kind === "method") {
        throw new AranError("initialize accessor kind mismatch", {
          binding,
          operation,
        });
      } else {
        throw new AranTypeError(operation.kind);
      }
    } else if (
      binding.type === "singleton-property" ||
      binding.type === "collection-property"
    ) {
      throw new AranError("cannot initialize property binding", binding);
    } else {
      throw new AranTypeError(binding);
    }
  } else if (operation.type === "set-private") {
    if (
      binding.type === "singleton-method" ||
      binding.type === "collection-method"
    ) {
      return makeExpressionEffect(
        makeThrowErrorExpression(
          "TypeError",
          `Cannot set private method #${operation.key}`,
          path,
        ),
        path,
      );
    } else if (
      binding.type === "singleton-accessor" ||
      binding.type === "collection-accessor"
    ) {
      if (binding.setter === null) {
        return makeExpressionEffect(
          makeThrowErrorExpression(
            "TypeError",
            `Cannot set private accessor #${operation.key}`,
            path,
          ),
          path,
        );
      } else {
        return makeConditionalEffect(
          makeAllowExpression({ path }, binding, operation),
          makeExpressionEffect(
            makeApplyExpression(
              makeReadCacheExpression(binding.setter, path),
              makeReadCacheExpression(operation.target, path),
              [makeReadCacheExpression(operation.value, path)],
              path,
            ),
            path,
          ),
          makeExpressionEffect(
            makeThrowErrorExpression(
              "TypeError",
              `Cannot set private accessor #${operation.key}`,
              path,
            ),
            path,
          ),
          path,
        );
      }
    } else if (binding.type === "collection-property") {
      return makeConditionalEffect(
        makeAllowExpression({ path }, binding, operation),
        makeExpressionEffect(
          makeApplyExpression(
            makeIntrinsicExpression("WeakMap.prototype.set", path),
            makeReadCacheExpression(binding.weakmap, path),
            [
              makeReadCacheExpression(operation.target, path),
              makeReadCacheExpression(operation.value, path),
            ],
            path,
          ),
          path,
        ),
        makeExpressionEffect(
          makeThrowErrorExpression(
            "TypeError",
            `Cannot set private accessor #${operation.key}`,
            path,
          ),
          path,
        ),
        path,
      );
    } else if (binding.type === "singleton-property") {
      return makeConditionalEffect(
        makeAllowExpression({ path }, binding, operation),
        listWriteCacheEffect(
          binding.value,
          makeReadCacheExpression(operation.value, path),
          path,
        ),
        makeExpressionEffect(
          makeThrowErrorExpression(
            "TypeError",
            `Cannot set private property #${operation.key}`,
            path,
          ),
          path,
        ),
        path,
      );
    } else {
      throw new AranTypeError(binding);
    }
  } else {
    throw new AranTypeError(operation);
  }
};
