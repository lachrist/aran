import { AranTypeError } from "../../../report.mjs";
import { hasOwn, map, pairup } from "../../../util/index.mjs";
import {
  cacheConstant,
  cacheWritable,
  makeWriteCacheEffect,
  makeReadCacheExpression,
} from "../../cache.mjs";
import { incorporateEffect } from "../../prelude/index.mjs";
import {
  makeBinaryExpression,
  makeThrowErrorExpression,
} from "../../intrinsic.mjs";
import { forkMeta, nextMeta } from "../../meta.mjs";
import {
  makeApplyExpression,
  makeConditionalEffect,
  makeConstructExpression,
  makeExpressionEffect,
  makeIntrinsicExpression,
} from "../../node.mjs";
import {
  bindSequence,
  flatSequence,
  initSequence,
  mapSequence,
  zeroSequence,
} from "../../../sequence.mjs";
import {
  listBindingDefineEffect,
  listBindingInitializeEffect,
  listBindingSetEffect,
  makeBindingGetExpression,
  makeBindingHasExpression,
  setupBinding,
} from "./binding.mjs";

const {
  Reflect: { defineProperty },
} = globalThis;

/**
 * @type {(
 *   binding1: import(".").DryPrivateBinding,
 *   binding2: import(".").DryPrivateBinding,
 * ) => import(".").DryPrivateBinding | null}
 */
const mergeBinding = (binding1, binding2) => {
  if (
    binding1.type === "singleton-accessor" &&
    binding2.type === "singleton-accessor"
  ) {
    if (binding1.getter !== null && binding2.getter !== null) {
      return null;
    }
    if (binding1.setter !== null && binding2.setter !== null) {
      return null;
    }
    return {
      ...binding1,
      getter: binding1.getter ?? binding2.getter,
      setter: binding1.setter ?? binding2.setter,
    };
  }
  if (
    binding1.type === "collection-accessor" &&
    binding2.type === "collection-accessor"
  ) {
    if (binding1.getter !== null && binding2.getter !== null) {
      return null;
    }
    if (binding1.setter !== null && binding2.setter !== null) {
      return null;
    }
    return {
      ...binding1,
      getter: binding1.getter ?? binding2.getter,
      setter: binding1.setter ?? binding2.setter,
    };
  }
  return null;
};

/* eslint-disable local/no-impure */
/**
 * @type {(
 *   hash: import("../../../hash").Hash,
 *   entries: [
 *     key: import("estree-sentry").PrivateKeyName,
 *     binding: import(".").DryPrivateBinding,
 *   ][],
 * ) => import("../../../sequence").Sequence<
 *   import("../../prelude").SyntaxErrorPrelude,
 *   { [k in import("estree-sentry").PrivateKeyName]?: import(".").DryPrivateBinding },
 * >}
 */
const reduceBindingEntry = (hash, entries) => {
  /**
   * @type {{ [k in import("estree-sentry").PrivateKeyName]?: import(".").DryPrivateBinding }}
   */
  const record = {};
  for (const [key, new_binding] of entries) {
    if (hasOwn(record, key)) {
      const old_binding = record[key];
      const binding = mergeBinding(old_binding, new_binding);
      if (binding === null) {
        return initSequence(
          [
            {
              type: "syntax-error",
              data: {
                message: `Duplicate private field #${key}`,
                origin: hash,
              },
            },
          ],
          {},
        );
      }
      defineProperty(record, key, {
        value: binding,
        writable: true,
        enumerable: true,
        configurable: true,
      });
    } else {
      defineProperty(record, key, {
        value: new_binding,
        writable: true,
        enumerable: true,
        configurable: true,
      });
    }
  }
  return zeroSequence(record);
};
/* eslint-enable local/no-impure */

/**
 * @type {(
 *   binding: import(".").DryPrivateBinding,
 *   frame: Omit<import(".").PrivateFrame, "record">,
 * ) => import(".").PrivateBinding}
 */
const hydrateBinding = (binding, { singleton, collection }) => {
  if (
    binding.type === "singleton-accessor" ||
    binding.type === "singleton-method" ||
    binding.type === "singleton-property"
  ) {
    return {
      ...binding,
      target: singleton,
    };
  } else if (
    binding.type === "collection-accessor" ||
    binding.type === "collection-method"
  ) {
    return {
      ...binding,
      weakset: collection,
    };
  } else if (binding.type === "collection-property") {
    return binding;
  } else {
    throw new AranTypeError(binding);
  }
};

/**
 * @type {import("../perform").Setup<
 *   import(".").PrivateFrame,
 *   import(".").RawPrivateFrame,
 *   (
 *     | import("../../prelude").MetaDeclarationPrelude
 *     | import("../../prelude").SyntaxErrorPrelude
 *     | import("../../prelude").PrefixPrelude
 *   ),
 * >}
 */
export const setupPrivateFrame = (hash, meta, entries) =>
  bindSequence(
    cacheWritable(forkMeta((meta = nextMeta(meta))), "aran.deadzone"),
    (singleton) =>
      bindSequence(
        cacheConstant(
          forkMeta((meta = nextMeta(meta))),
          makeConstructExpression(
            makeIntrinsicExpression("WeakSet", hash),
            [],
            hash,
          ),
          hash,
        ),
        (collection) =>
          bindSequence(
            flatSequence(
              map(entries, ([key, kind]) =>
                mapSequence(
                  setupBinding(hash, forkMeta((meta = nextMeta(meta))), kind),
                  (binding) => pairup(key, binding),
                ),
              ),
            ),
            (entries) =>
              mapSequence(reduceBindingEntry(hash, entries), (record) => ({
                type: "private",
                singleton,
                collection,
                record,
              })),
          ),
      ),
  );

/**
 * @type {<O extends { key: import("estree-sentry").PrivateKeyName }, X>(
 *   perform: import("../perform").Perform<import(".").PrivateBinding, O, X>
 * ) => import("../perform").Perform<import(".").PrivateFrame, O, X | null>}
 */
const compileOperation = (perform) => (hash, meta, frame, operation) => {
  if (hasOwn(frame.record, operation.key)) {
    return perform(
      hash,
      meta,
      hydrateBinding(frame.record[operation.key], frame),
      operation,
    );
  } else {
    return null;
  }
};

export const makeFramePrivateGetExpression = compileOperation(
  makeBindingGetExpression,
);

export const makeFramePrivateHasExpression = compileOperation(
  makeBindingHasExpression,
);

export const listFramePrivateDefineEffect = compileOperation(
  listBindingDefineEffect,
);

export const listFramePrivateSetEffect = compileOperation(listBindingSetEffect);

export const listFramePrivateInitializeEffect = compileOperation(
  listBindingInitializeEffect,
);

/**
 * @type {import("../perform").PerformEffect<
 *   import(".").PrivateFrame,
 *   import(".").RegisterPrivateCollectionOperation,
 *   import("../../prelude").MetaDeclarationPrelude
 * >}
 */
export const listFramePrivateRegisterCollectionEffect = (
  hash,
  meta,
  frame,
  operation,
) =>
  incorporateEffect(
    mapSequence(
      cacheConstant(forkMeta((meta = nextMeta(meta))), operation.target, hash),
      (target) => [
        makeConditionalEffect(
          makeApplyExpression(
            makeIntrinsicExpression("WeakSet.prototype.has", hash),
            makeReadCacheExpression(frame.collection, hash),
            [makeReadCacheExpression(target, hash)],
            hash,
          ),
          [
            makeExpressionEffect(
              makeThrowErrorExpression(
                "TypeError",
                "Duplicate private registration",
                hash,
              ),
              hash,
            ),
          ],
          [
            makeExpressionEffect(
              makeApplyExpression(
                makeIntrinsicExpression("WeakSet.prototype.add", hash),
                makeReadCacheExpression(frame.collection, hash),
                [makeReadCacheExpression(target, hash)],
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

/**
 * @type {import("../perform").PerformEffect<
 *   import(".").PrivateFrame,
 *   import(".").RegisterPrivateSingletonOperation,
 *   import("../../prelude").MetaDeclarationPrelude
 * >}
 */
export const listFramePrivateRegisterSingletonEffect = (
  hash,
  meta,
  frame,
  operation,
) =>
  incorporateEffect(
    mapSequence(
      cacheConstant(forkMeta((meta = nextMeta(meta))), operation.target, hash),
      (target) => [
        makeConditionalEffect(
          makeBinaryExpression(
            "!==",
            makeReadCacheExpression(frame.singleton, hash),
            makeIntrinsicExpression("aran.deadzone", hash),
            hash,
          ),
          [
            makeExpressionEffect(
              makeThrowErrorExpression(
                "TypeError",
                "Duplicate private registration",
                hash,
              ),
              hash,
            ),
          ],
          [
            makeWriteCacheEffect(
              frame.singleton,
              makeReadCacheExpression(target, hash),
              hash,
            ),
          ],
          hash,
        ),
      ],
    ),
    hash,
  );
