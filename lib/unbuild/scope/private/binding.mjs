import { AranError, AranTypeError } from "../../../error.mjs";
import {
  cacheConstant,
  cacheWritable,
  makeWriteCacheEffect,
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
import {
  incorporateEffect,
  incorporateExpression,
} from "../../prelude/index.mjs";
import { mapSequence, zeroSequence } from "../../../sequence.mjs";
import { forkMeta, nextMeta } from "../../meta.mjs";

/**
 * @type {(
 *   site: import("../../site").VoidSite,
 *   binding: import(".").PrivateBinding,
 *   options: {
 *     target: import("../../atom").Expression,
 *   },
 * ) => import("../../atom").Expression}
 */
const makeAllowExpression = ({ path }, binding, { target }) => {
  if (binding.type === "collection-property") {
    return makeApplyExpression(
      makeIntrinsicExpression("WeakMap.prototype.has", path),
      makeReadCacheExpression(binding.weakmap, path),
      [target],
      path,
    );
  } else if (
    binding.type === "collection-method" ||
    binding.type === "collection-accessor"
  ) {
    return makeApplyExpression(
      makeIntrinsicExpression("WeakSet.prototype.has", path),
      makeReadCacheExpression(binding.weakset, path),
      [target],
      path,
    );
  } else if (binding.type === "singleton-property") {
    return makeConditionalExpression(
      makeBinaryExpression(
        "===",
        target,
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
      target,
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
 * ) => import("../../../sequence").Sequence<
 *   (
 *     | import("../../prelude").MetaDeclarationPrelude
 *     | import("../../prelude").PrefixPrelude
 *   ),
 *   import(".").DryPrivateBinding,
 * >}
 */
export const setupBinding = ({ path, meta }, kind) => {
  if (kind === "singleton-property") {
    return mapSequence(cacheWritable(meta, "aran.deadzone"), (value) => ({
      type: "singleton-property",
      value,
    }));
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
    return mapSequence(cacheWritable(meta, "aran.deadzone"), (method) => ({
      type: kind,
      method,
    }));
  } else if (kind === "collection-getter" || kind === "singleton-getter") {
    return mapSequence(cacheWritable(meta, "aran.deadzone"), (getter) => ({
      type: KINDS[kind],
      getter,
      setter: null,
    }));
  } else if (kind === "collection-setter" || kind === "singleton-setter") {
    return mapSequence(cacheWritable(meta, "aran.deadzone"), (setter) => ({
      type: KINDS[kind],
      getter: null,
      setter,
    }));
  } else {
    throw new AranError("invalid private binding kind", kind);
  }
};

/**
 * @type {(
 *   site: import("../../site").LeafSite,
 *   binding: import(".").PrivateBinding,
 *   operation: import("../operation").PrivateLoadOperation,
 * ) => import("../../../sequence").Sequence<
 *   import("../../prelude").MetaDeclarationPrelude,
 *   import("../../atom").Expression,
 * >}
 */
export const makeBindingLoadExpression = (
  { meta, path },
  binding,
  operation,
) => {
  if (operation.type === "get-private") {
    if (
      binding.type === "singleton-accessor" ||
      binding.type === "collection-accessor"
    ) {
      const { getter } = binding;
      if (getter === null) {
        return zeroSequence(
          makeThrowErrorExpression(
            "TypeError",
            `Cannot get private accessor #${operation.key}`,
            path,
          ),
        );
      } else {
        return incorporateExpression(
          mapSequence(cacheConstant(meta, operation.target, path), (target) =>
            makeConditionalExpression(
              makeAllowExpression({ path }, binding, {
                target: makeReadCacheExpression(target, path),
              }),
              makeApplyExpression(
                makeReadCacheExpression(getter, path),
                makeReadCacheExpression(target, path),
                [],
                path,
              ),
              makeThrowErrorExpression(
                "TypeError",
                `Cannot get private accessor #${operation.key}`,
                path,
              ),
              path,
            ),
          ),
          path,
        );
      }
    } else if (
      binding.type === "singleton-method" ||
      binding.type === "collection-method"
    ) {
      return zeroSequence(
        makeConditionalExpression(
          makeAllowExpression({ path }, binding, operation),
          makeReadCacheExpression(binding.method, path),
          makeThrowErrorExpression(
            "TypeError",
            `Cannot get private accessor #${operation.key}`,
            path,
          ),
          path,
        ),
      );
    } else if (binding.type === "collection-property") {
      return incorporateExpression(
        mapSequence(cacheConstant(meta, operation.target, path), (target) =>
          makeConditionalExpression(
            makeAllowExpression({ path }, binding, {
              target: makeReadCacheExpression(target, path),
            }),
            makeApplyExpression(
              makeIntrinsicExpression("WeakMap.prototype.get", path),
              makeReadCacheExpression(binding.weakmap, path),
              [makeReadCacheExpression(target, path)],
              path,
            ),
            makeThrowErrorExpression(
              "TypeError",
              `Cannot get private property #${operation.key}`,
              path,
            ),
            path,
          ),
        ),
        path,
      );
    } else if (binding.type === "singleton-property") {
      return zeroSequence(
        makeConditionalExpression(
          makeAllowExpression({ path }, binding, operation),
          makeReadCacheExpression(binding.value, path),
          makeThrowErrorExpression(
            "TypeError",
            `Cannot get private property #${operation.key}`,
            path,
          ),
          path,
        ),
      );
    } else {
      throw new AranTypeError(binding);
    }
  } else if (operation.type === "has-private") {
    return incorporateExpression(
      mapSequence(
        cacheConstant(
          forkMeta((meta = nextMeta(meta))),
          operation.target,
          path,
        ),
        (target) =>
          makeConditionalExpression(
            makeIsProperObjectExpression({ path }, { value: target }),
            makeAllowExpression({ path }, binding, {
              target: makeReadCacheExpression(target, path),
            }),
            makeThrowErrorExpression(
              "TypeError",
              "Cannot query private property of non-object",
              path,
            ),
            path,
          ),
      ),
      path,
    );
  } else {
    throw new AranTypeError(operation);
  }
};

/**
 * @type {(
 *   site: import("../../site").LeafSite,
 *   binding: import(".").PrivateBinding,
 *   operation: (
 *     | import("../operation").DefinePrivateOperation
 *     | import("../operation").InitializePrivateOperation
 *     | import("../operation").SetPrivateOperation
 *   ),
 * ) => import("../../../sequence").Sequence<
 *   import("../../prelude").MetaDeclarationPrelude,
 *   import("../../atom").Effect[],
 * >}
 */
export const listBindingSaveEffect = ({ path, meta }, binding, operation) => {
  if (operation.type === "define-private") {
    if (binding.type === "collection-property") {
      return incorporateEffect(
        mapSequence(cacheConstant(meta, operation.target, path), (target) => [
          makeConditionalEffect(
            makeApplyExpression(
              makeIntrinsicExpression("WeakMap.prototype.has", path),
              makeReadCacheExpression(binding.weakmap, path),
              [makeReadCacheExpression(target, path)],
              path,
            ),
            [
              makeExpressionEffect(
                makeThrowErrorExpression(
                  "TypeError",
                  `Duplicate definition of private property #${operation.key}`,
                  path,
                ),
                path,
              ),
            ],
            [
              makeExpressionEffect(
                makeApplyExpression(
                  makeIntrinsicExpression("WeakMap.prototype.set", path),
                  makeReadCacheExpression(binding.weakmap, path),
                  [makeReadCacheExpression(target, path), operation.value],
                  path,
                ),
                path,
              ),
            ],
            path,
          ),
        ]),
        path,
      );
    } else if (binding.type === "singleton-property") {
      return zeroSequence([
        makeConditionalEffect(
          makeBinaryExpression(
            "!==",
            makeReadCacheExpression(binding.value, path),
            makeIntrinsicExpression("aran.deadzone", path),
            path,
          ),
          [
            makeExpressionEffect(
              makeThrowErrorExpression(
                "TypeError",
                `Duplicate definition of private property #${operation.key}`,
                path,
              ),
              path,
            ),
          ],
          [makeWriteCacheEffect(binding.value, operation.value, path)],
          path,
        ),
      ]);
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
        return zeroSequence([
          makeWriteCacheEffect(binding.method, operation.value, path),
        ]);
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
          return zeroSequence([
            makeWriteCacheEffect(cache, operation.value, path),
          ]);
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
      return zeroSequence([
        makeExpressionEffect(
          makeThrowErrorExpression(
            "TypeError",
            `Cannot set private method #${operation.key}`,
            path,
          ),
          path,
        ),
      ]);
    } else if (
      binding.type === "singleton-accessor" ||
      binding.type === "collection-accessor"
    ) {
      const { setter } = binding;
      if (setter === null) {
        return zeroSequence([
          makeExpressionEffect(
            makeThrowErrorExpression(
              "TypeError",
              `Cannot set private accessor #${operation.key}`,
              path,
            ),
            path,
          ),
        ]);
      } else {
        return incorporateEffect(
          mapSequence(cacheConstant(meta, operation.target, path), (target) => [
            makeConditionalEffect(
              makeAllowExpression({ path }, binding, {
                target: makeReadCacheExpression(target, path),
              }),
              [
                makeExpressionEffect(
                  makeApplyExpression(
                    makeReadCacheExpression(setter, path),
                    makeReadCacheExpression(target, path),
                    [operation.value],
                    path,
                  ),
                  path,
                ),
              ],
              [
                makeExpressionEffect(
                  makeThrowErrorExpression(
                    "TypeError",
                    `Cannot set private accessor #${operation.key}`,
                    path,
                  ),
                  path,
                ),
              ],
              path,
            ),
          ]),
          path,
        );
      }
    } else if (binding.type === "collection-property") {
      return incorporateEffect(
        mapSequence(cacheConstant(meta, operation.target, path), (target) => [
          makeConditionalEffect(
            makeAllowExpression({ path }, binding, {
              target: makeReadCacheExpression(target, path),
            }),
            [
              makeExpressionEffect(
                makeApplyExpression(
                  makeIntrinsicExpression("WeakMap.prototype.set", path),
                  makeReadCacheExpression(binding.weakmap, path),
                  [makeReadCacheExpression(target, path), operation.value],
                  path,
                ),
                path,
              ),
            ],
            [
              makeExpressionEffect(
                makeThrowErrorExpression(
                  "TypeError",
                  `Cannot set private accessor #${operation.key}`,
                  path,
                ),
                path,
              ),
            ],
            path,
          ),
        ]),
        path,
      );
    } else if (binding.type === "singleton-property") {
      return zeroSequence([
        makeConditionalEffect(
          makeAllowExpression({ path }, binding, operation),
          [makeWriteCacheEffect(binding.value, operation.value, path)],
          [
            makeExpressionEffect(
              makeThrowErrorExpression(
                "TypeError",
                `Cannot set private property #${operation.key}`,
                path,
              ),
              path,
            ),
          ],
          path,
        ),
      ]);
    } else {
      throw new AranTypeError(binding);
    }
  } else {
    throw new AranTypeError(operation);
  }
};
