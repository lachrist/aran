import { AranExecError, AranTypeError } from "../../../error.mjs";
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
  listExpressionEffect,
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
  flatenTree,
  mapSequence,
  mapTwoSequence,
  zeroSequence,
} from "../../../util/index.mjs";
import { forkMeta, nextMeta } from "../../meta.mjs";

/**
 * @type {(
 *   hash: import("../../hash.d.ts").Hash,
 *   binding: import("./index.d.ts").PrivateBinding,
 *   options: {
 *     target: import("../../atom.d.ts").Expression,
 *   },
 * ) => import("../../atom.d.ts").Expression}
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
        makeIntrinsicExpression("aran.deadzone_symbol", hash),
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
 * @type {import("../api.d.ts").Setup<
 *   import("./index.d.ts").PrivateKind,
 *   (
 *     | import("../../prelude/index.d.ts").MetaDeclarationPrelude
 *     | import("../../prelude/index.d.ts").PrefixPrelude
 *   ),
 *   import("./index.d.ts").DryPrivateBinding,
 * >}
 */
export const setupBinding = (hash, meta, kind) => {
  if (kind === "singleton-property") {
    return mapSequence(
      cacheWritable(meta, "aran.deadzone_symbol"),
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
    return mapSequence(
      cacheWritable(meta, "aran.deadzone_symbol"),
      (method) => ({
        type: kind,
        method,
      }),
    );
  } else if (kind === "collection-getter" || kind === "singleton-getter") {
    return mapSequence(
      cacheWritable(meta, "aran.deadzone_symbol"),
      (getter) => ({
        type: KINDS[kind],
        getter,
        setter: null,
      }),
    );
  } else if (kind === "collection-setter" || kind === "singleton-setter") {
    return mapSequence(
      cacheWritable(meta, "aran.deadzone_symbol"),
      (setter) => ({
        type: KINDS[kind],
        getter: null,
        setter,
      }),
    );
  } else {
    throw new AranExecError("invalid private binding kind", kind);
  }
};

/**
 * @type {import("../api.d.ts").PerformExpression<
 *   import("./index.d.ts").PrivateBinding,
 *   import("./index.d.ts").GetPrivateOperation,
 *   import("../../prelude/index.d.ts").MetaDeclarationPrelude,
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
          flatenTree(listExpressionEffect(operation.target, hash)),
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
 * @type {import("../api.d.ts").PerformExpression<
 *   import("./index.d.ts").PrivateBinding,
 *   import("./index.d.ts").HasPrivateOperation,
 *   import("../../prelude/index.d.ts").MetaDeclarationPrelude,
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
 * @type {import("../api.d.ts").PerformEffect<
 *   import("./index.d.ts").PrivateBinding,
 *   import("./index.d.ts").DefinePrivateOperation,
 *   import("../../prelude/index.d.ts").MetaDeclarationPrelude,
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
        (target, value) =>
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
        (_target, value) =>
          makeConditionalEffect(
            makeBinaryExpression(
              "!==",
              makeReadCacheExpression(binding.value, hash),
              makeIntrinsicExpression("aran.deadzone_symbol", hash),
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
 * @type {import("../api.d.ts").PerformEffect<
 *   import("./index.d.ts").PrivateBinding,
 *   import("./index.d.ts").InitializePrivateOperation,
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
        listExpressionEffect(operation.value, hash),
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
        return zeroSequence(makeWriteCacheEffect(cache, operation.value, hash));
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
 * @type {import("../api.d.ts").PerformEffect<
 *   import("./index.d.ts").PrivateBinding,
 *   import("./index.d.ts").SetPrivateOperation,
 *   import("../../prelude/index.d.ts").MetaDeclarationPrelude,
 * >}
 */
export const listBindingSetEffect = (hash, meta, binding, operation) => {
  if (
    binding.type === "singleton-method" ||
    binding.type === "collection-method"
  ) {
    return zeroSequence([
      listExpressionEffect(operation.target, hash),
      listExpressionEffect(operation.value, hash),
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
        listExpressionEffect(operation.target, hash),
        listExpressionEffect(operation.value, hash),
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
          (target, value) =>
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
        (target, value) =>
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
        (target, value) =>
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
      ),
      hash,
    );
  } else {
    throw new AranTypeError(binding);
  }
};
