import { AranExecError, AranTypeError } from "../../../report.mjs";
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
  makeSequenceExpression,
} from "../../node.mjs";
import {
  incorporateEffect,
  incorporateExpression,
} from "../../prelude/index.mjs";
import {
  mapSequence,
  mapTwoSequence,
  zeroSequence,
} from "../../../sequence.mjs";
import { forkMeta, nextMeta } from "../../meta.mjs";

/**
 * @type {(
 *   hash: import("../../../hash").Hash,
 *   binding: import(".").PrivateBinding,
 *   options: {
 *     target: import("../../atom").Expression,
 *   },
 * ) => import("../../atom").Expression}
 */
const makeAllowExpression = (hash, binding, { target }) => {
  if (binding.type === "collection-property") {
    return makeApplyExpression(
      makeIntrinsicExpression("WeakMap.prototype.has", hash),
      makeReadCacheExpression(binding.weakmap, hash),
      [target],
      hash,
    );
  } else if (
    binding.type === "collection-method" ||
    binding.type === "collection-accessor"
  ) {
    return makeApplyExpression(
      makeIntrinsicExpression("WeakSet.prototype.has", hash),
      makeReadCacheExpression(binding.weakset, hash),
      [target],
      hash,
    );
  } else if (binding.type === "singleton-property") {
    return makeConditionalExpression(
      makeBinaryExpression(
        "===",
        target,
        makeReadCacheExpression(binding.target, hash),
        hash,
      ),
      makeBinaryExpression(
        "!==",
        makeReadCacheExpression(binding.value, hash),
        makeIntrinsicExpression("aran.deadzone", hash),
        hash,
      ),
      makePrimitiveExpression(false, hash),
      hash,
    );
  } else if (
    binding.type === "singleton-method" ||
    binding.type === "singleton-accessor"
  ) {
    return makeBinaryExpression(
      "===",
      target,
      makeReadCacheExpression(binding.target, hash),
      hash,
    );
  } else {
    throw new AranTypeError(binding);
  }
};

/**
 * @type {{
 *   "collection-getter": "collection-accessor",
 *   "collection-setter": "collection-accessor",
 *   "singleton-getter": "singleton-accessor",
 *   "singleton-setter": "singleton-accessor",
 * }}
 */
const KINDS = {
  "collection-getter": "collection-accessor",
  "collection-setter": "collection-accessor",
  "singleton-getter": "singleton-accessor",
  "singleton-setter": "singleton-accessor",
};

/**
 * @type {import("../perform").Setup<
 *   import(".").DryPrivateBinding,
 *   import(".").PrivateKind,
 *   (
 *     | import("../../prelude").MetaDeclarationPrelude
 *     | import("../../prelude").PrefixPrelude
 *   ),
 * >}
 */
export const setupBinding = (hash, meta, kind) => {
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
          makeIntrinsicExpression("WeakMap", hash),
          [],
          hash,
        ),
        hash,
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
    throw new AranExecError("invalid private binding kind", kind);
  }
};

/**
 * @type {import("../perform").PerformExpression<
 *   import(".").PrivateBinding,
 *   import(".").GetPrivateOperation,
 *   import("../../prelude").MetaDeclarationPrelude,
 * >}
 */
export const makeBindingGetExpression = (hash, meta, binding, operation) => {
  if (
    binding.type === "singleton-accessor" ||
    binding.type === "collection-accessor"
  ) {
    const { getter } = binding;
    if (getter === null) {
      return zeroSequence(
        makeSequenceExpression(
          [makeExpressionEffect(operation.target, hash)],
          makeThrowErrorExpression(
            "TypeError",
            `Cannot get private accessor #${operation.key}`,
            hash,
          ),
          hash,
        ),
      );
    } else {
      return incorporateExpression(
        mapSequence(cacheConstant(meta, operation.target, hash), (target) =>
          makeConditionalExpression(
            makeAllowExpression(hash, binding, {
              target: makeReadCacheExpression(target, hash),
            }),
            makeApplyExpression(
              makeReadCacheExpression(getter, hash),
              makeReadCacheExpression(target, hash),
              [],
              hash,
            ),
            makeThrowErrorExpression(
              "TypeError",
              `Cannot get private accessor #${operation.key}`,
              hash,
            ),
            hash,
          ),
        ),
        hash,
      );
    }
  } else if (
    binding.type === "singleton-method" ||
    binding.type === "collection-method"
  ) {
    return zeroSequence(
      makeConditionalExpression(
        makeAllowExpression(hash, binding, operation),
        makeReadCacheExpression(binding.method, hash),
        makeThrowErrorExpression(
          "TypeError",
          `Cannot get private accessor #${operation.key}`,
          hash,
        ),
        hash,
      ),
    );
  } else if (binding.type === "collection-property") {
    return incorporateExpression(
      mapSequence(cacheConstant(meta, operation.target, hash), (target) =>
        makeConditionalExpression(
          makeAllowExpression(hash, binding, {
            target: makeReadCacheExpression(target, hash),
          }),
          makeApplyExpression(
            makeIntrinsicExpression("WeakMap.prototype.get", hash),
            makeReadCacheExpression(binding.weakmap, hash),
            [makeReadCacheExpression(target, hash)],
            hash,
          ),
          makeThrowErrorExpression(
            "TypeError",
            `Cannot get private property #${operation.key}`,
            hash,
          ),
          hash,
        ),
      ),
      hash,
    );
  } else if (binding.type === "singleton-property") {
    return zeroSequence(
      makeConditionalExpression(
        makeAllowExpression(hash, binding, operation),
        makeReadCacheExpression(binding.value, hash),
        makeThrowErrorExpression(
          "TypeError",
          `Cannot get private property #${operation.key}`,
          hash,
        ),
        hash,
      ),
    );
  } else {
    throw new AranTypeError(binding);
  }
};

/**
 * @type {import("../perform").PerformExpression<
 *   import(".").PrivateBinding,
 *   import(".").HasPrivateOperation,
 *   import("../../prelude").MetaDeclarationPrelude,
 * >}
 */
export const makeBindingHasExpression = (hash, meta, binding, operation) =>
  incorporateExpression(
    mapSequence(
      cacheConstant(forkMeta((meta = nextMeta(meta))), operation.target, hash),
      (target) =>
        makeConditionalExpression(
          makeIsProperObjectExpression(hash, { value: target }),
          makeAllowExpression(hash, binding, {
            target: makeReadCacheExpression(target, hash),
          }),
          makeThrowErrorExpression(
            "TypeError",
            "Cannot query private property of non-object",
            hash,
          ),
          hash,
        ),
    ),
    hash,
  );

/**
 * @type {import("../perform").PerformEffect<
 *   import(".").PrivateBinding,
 *   import(".").DefinePrivateOperation,
 *   import("../../prelude").MetaDeclarationPrelude,
 * >}
 */
export const listBindingDefineEffect = (hash, meta, binding, operation) => {
  if (binding.type === "collection-property") {
    return incorporateEffect(
      mapTwoSequence(
        cacheConstant(
          forkMeta((meta = nextMeta(meta))),
          operation.target,
          hash,
        ),
        cacheConstant(forkMeta((meta = nextMeta(meta))), operation.value, hash),
        (target, value) => [
          makeConditionalEffect(
            makeApplyExpression(
              makeIntrinsicExpression("WeakMap.prototype.has", hash),
              makeReadCacheExpression(binding.weakmap, hash),
              [makeReadCacheExpression(target, hash)],
              hash,
            ),
            [
              makeExpressionEffect(
                makeThrowErrorExpression(
                  "TypeError",
                  `Duplicate definition of private property #${operation.key}`,
                  hash,
                ),
                hash,
              ),
            ],
            [
              makeExpressionEffect(
                makeApplyExpression(
                  makeIntrinsicExpression("WeakMap.prototype.set", hash),
                  makeReadCacheExpression(binding.weakmap, hash),
                  [
                    makeReadCacheExpression(target, hash),
                    makeReadCacheExpression(value, hash),
                  ],
                  hash,
                ),
                hash,
              ),
            ],
            hash,
          ),
        ],
      ),
      hash,
    );
  } else if (binding.type === "singleton-property") {
    return incorporateEffect(
      mapTwoSequence(
        cacheConstant(
          forkMeta((meta = nextMeta(meta))),
          operation.target,
          hash,
        ),
        cacheConstant(forkMeta((meta = nextMeta(meta))), operation.value, hash),
        (_target, value) => [
          makeConditionalEffect(
            makeBinaryExpression(
              "!==",
              makeReadCacheExpression(binding.value, hash),
              makeIntrinsicExpression("aran.deadzone", hash),
              hash,
            ),
            [
              makeExpressionEffect(
                makeThrowErrorExpression(
                  "TypeError",
                  `Duplicate definition of private property #${operation.key}`,
                  hash,
                ),
                hash,
              ),
            ],
            [
              makeWriteCacheEffect(
                binding.value,
                makeReadCacheExpression(value, hash),
                hash,
              ),
            ],
            hash,
          ),
        ],
      ),
      hash,
    );
  } else if (
    binding.type === "collection-method" ||
    binding.type === "singleton-method" ||
    binding.type === "collection-accessor" ||
    binding.type === "singleton-accessor"
  ) {
    throw new AranExecError("cannot define method|accessor binding", binding);
  } else {
    throw new AranTypeError(binding);
  }
};

/**
 * @type {import("../perform").PerformEffect<
 *   import(".").PrivateBinding,
 *   import(".").InitializePrivateOperation,
 *   never,
 * >}
 */
export const listBindingInitializeEffect = (
  hash,
  _meta,
  binding,
  operation,
) => {
  if (
    binding.type === "singleton-method" ||
    binding.type === "collection-method"
  ) {
    if (operation.kind === "method") {
      return zeroSequence([
        makeExpressionEffect(operation.value, hash),
        makeWriteCacheEffect(binding.method, operation.value, hash),
      ]);
    } else if (operation.kind === "getter" || operation.kind === "setter") {
      throw new AranExecError("initialize method kind mismatch", {
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
        throw new AranExecError("cannot initialize missing accessor", {
          binding,
          operation,
        });
      } else {
        return zeroSequence([
          makeWriteCacheEffect(cache, operation.value, hash),
        ]);
      }
    } else if (operation.kind === "method") {
      throw new AranExecError("initialize accessor kind mismatch", {
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
    throw new AranExecError("cannot initialize property binding", binding);
  } else {
    throw new AranTypeError(binding);
  }
};

/**
 * @type {import("../perform").PerformEffect<
 *   import(".").PrivateBinding,
 *   import(".").SetPrivateOperation,
 *   import("../../prelude").MetaDeclarationPrelude,
 * >}
 */
export const listBindingSetEffect = (hash, meta, binding, operation) => {
  if (
    binding.type === "singleton-method" ||
    binding.type === "collection-method"
  ) {
    return zeroSequence([
      makeExpressionEffect(operation.target, hash),
      makeExpressionEffect(operation.value, hash),
      makeExpressionEffect(
        makeThrowErrorExpression(
          "TypeError",
          `Cannot set private method #${operation.key}`,
          hash,
        ),
        hash,
      ),
    ]);
  } else if (
    binding.type === "singleton-accessor" ||
    binding.type === "collection-accessor"
  ) {
    const { setter } = binding;
    if (setter === null) {
      return zeroSequence([
        makeExpressionEffect(operation.target, hash),
        makeExpressionEffect(operation.value, hash),
        makeExpressionEffect(
          makeThrowErrorExpression(
            "TypeError",
            `Cannot set private accessor #${operation.key}`,
            hash,
          ),
          hash,
        ),
      ]);
    } else {
      return incorporateEffect(
        mapTwoSequence(
          cacheConstant(
            forkMeta((meta = nextMeta(meta))),
            operation.target,
            hash,
          ),
          cacheConstant(
            forkMeta((meta = nextMeta(meta))),
            operation.value,
            hash,
          ),
          (target, value) => [
            makeConditionalEffect(
              makeAllowExpression(hash, binding, {
                target: makeReadCacheExpression(target, hash),
              }),
              [
                makeExpressionEffect(
                  makeApplyExpression(
                    makeReadCacheExpression(setter, hash),
                    makeReadCacheExpression(target, hash),
                    [makeReadCacheExpression(value, hash)],
                    hash,
                  ),
                  hash,
                ),
              ],
              [
                makeExpressionEffect(
                  makeThrowErrorExpression(
                    "TypeError",
                    `Cannot set private accessor #${operation.key}`,
                    hash,
                  ),
                  hash,
                ),
              ],
              hash,
            ),
          ],
        ),
        hash,
      );
    }
  } else if (binding.type === "collection-property") {
    return incorporateEffect(
      mapTwoSequence(
        cacheConstant(
          forkMeta((meta = nextMeta(meta))),
          operation.target,
          hash,
        ),
        cacheConstant(forkMeta((meta = nextMeta(meta))), operation.value, hash),
        (target, value) => [
          makeConditionalEffect(
            makeAllowExpression(hash, binding, {
              target: makeReadCacheExpression(target, hash),
            }),
            [
              makeExpressionEffect(
                makeApplyExpression(
                  makeIntrinsicExpression("WeakMap.prototype.set", hash),
                  makeReadCacheExpression(binding.weakmap, hash),
                  [
                    makeReadCacheExpression(target, hash),
                    makeReadCacheExpression(value, hash),
                  ],
                  hash,
                ),
                hash,
              ),
            ],
            [
              makeExpressionEffect(
                makeThrowErrorExpression(
                  "TypeError",
                  `Cannot set private accessor #${operation.key}`,
                  hash,
                ),
                hash,
              ),
            ],
            hash,
          ),
        ],
      ),
      hash,
    );
  } else if (binding.type === "singleton-property") {
    return incorporateEffect(
      mapTwoSequence(
        cacheConstant(
          forkMeta((meta = nextMeta(meta))),
          operation.target,
          hash,
        ),
        cacheConstant(forkMeta((meta = nextMeta(meta))), operation.value, hash),
        (target, value) => [
          makeConditionalEffect(
            makeAllowExpression(hash, binding, {
              target: makeReadCacheExpression(target, hash),
            }),
            [
              makeWriteCacheEffect(
                binding.value,
                makeReadCacheExpression(value, hash),
                hash,
              ),
            ],
            [
              makeExpressionEffect(
                makeThrowErrorExpression(
                  "TypeError",
                  `Cannot set private property #${operation.key}`,
                  hash,
                ),
                hash,
              ),
            ],
            hash,
          ),
        ],
      ),
      hash,
    );
  } else {
    throw new AranTypeError(binding);
  }
};
