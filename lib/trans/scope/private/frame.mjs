import { AranTypeError } from "../../../error.mjs";
import {
  hasOwn,
  map,
  tuple2,
  bindSequence,
  flatSequence,
  initSequence,
  mapSequence,
  zeroSequence,
} from "../../../util/index.mjs";
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
 *   binding1: import("./index.d.ts").DryPrivateBinding,
 *   binding2: import("./index.d.ts").DryPrivateBinding,
 * ) => import("./index.d.ts").DryPrivateBinding | null}
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
 *   hash: import("../../hash.d.ts").Hash,
 *   entries: [
 *     key: import("estree-sentry").PrivateKeyName,
 *     binding: import("./index.d.ts").DryPrivateBinding,
 *   ][],
 * ) => import("../../../util/sequence.d.ts").Sequence<
 *   import("../../prelude/index.d.ts").SyntaxErrorPrelude,
 *   { [k in import("estree-sentry").PrivateKeyName]?: import("./index.d.ts").DryPrivateBinding },
 * >}
 */
const reduceBindingEntry = (hash, entries) => {
  /**
   * @type {{ [k in import("estree-sentry").PrivateKeyName]?: import("./index.d.ts").DryPrivateBinding }}
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
 *   binding: import("./index.d.ts").DryPrivateBinding,
 *   frame: Omit<import("./index.d.ts").PrivateFrame, "record">,
 * ) => import("./index.d.ts").PrivateBinding}
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
 * @type {import("../api.d.ts").Setup<
 *   import("./index.d.ts").RawPrivateFrame,
 *   (
 *     | import("../../prelude/index.d.ts").MetaDeclarationPrelude
 *     | import("../../prelude/index.d.ts").SyntaxErrorPrelude
 *     | import("../../prelude/index.d.ts").PrefixPrelude
 *   ),
 *   import("./index.d.ts").PrivateFrame,
 * >}
 */
export const setupPrivateFrame = (hash, meta, entries) =>
  bindSequence(
    cacheWritable(forkMeta((meta = nextMeta(meta))), "aran.deadzone_symbol"),
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
                  (binding) => tuple2(key, binding),
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
 * @type {<O extends { key: import("estree-sentry").PrivateKeyName }, W, X>(
 *   perform: import("../api.d.ts").Perform<import("./index.d.ts").PrivateBinding, O, W, X>
 * ) => import("../api.d.ts").PerformMaybe<import("./index.d.ts").PrivateFrame, O, W, X>}
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

export const makeFrameGetPrivateExpression = compileOperation(
  makeBindingGetExpression,
);

export const makeFrameHasPrivateExpression = compileOperation(
  makeBindingHasExpression,
);

export const listFrameDefinePrivateEffect = compileOperation(
  listBindingDefineEffect,
);

export const listFrameSetPrivateEffect = compileOperation(listBindingSetEffect);

export const listFrameInitializePrivateEffect = compileOperation(
  listBindingInitializeEffect,
);

/**
 * @type {import("../api.d.ts").PerformEffect<
 *   import("./index.d.ts").PrivateFrame,
 *   import("./index.d.ts").RegisterCollectionPrivateOperation,
 *   import("../../prelude/index.d.ts").MetaDeclarationPrelude
 * >}
 */
export const listFrameRegisterCollectionPrivateEffect = (
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
 * @type {import("../api.d.ts").PerformEffect<
 *   import("./index.d.ts").PrivateFrame,
 *   import("./index.d.ts").RegisterSingletonPrivateOperation,
 *   import("../../prelude/index.d.ts").MetaDeclarationPrelude
 * >}
 */
export const listFrameRegisterSingletonPrivateEffect = (
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
            makeIntrinsicExpression("aran.deadzone_symbol", hash),
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
