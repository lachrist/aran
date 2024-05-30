import { AranTypeError } from "../../../error.mjs";
import { hasOwn, map, pairup } from "../../../util/index.mjs";
import {
  cacheConstant,
  cacheWritable,
  makeWriteCacheEffect,
  makeReadCacheExpression,
} from "../../cache.mjs";
import { makeRegularEarlyError } from "../../early-error.mjs";
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
import { incorporatePrefixEffect } from "../../prefix.mjs";
import {
  bindSequence,
  flatSequence,
  initSequence,
  mapSequence,
  zeroSequence,
} from "../../../sequence.mjs";
import {
  listBindingSaveEffect,
  makeBindingLoadExpression,
  setupBinding,
} from "./binding.mjs";
import { makeEarlyErrorPrelude } from "../../prelude.mjs";

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
 *   site: import("../../site").VoidSite,
 *   entries: [
 *     key: import("../../../estree").PrivateKey,
 *     binding: import(".").DryPrivateBinding,
 *   ][],
 * ) => import("../../../sequence").Sequence<
 *   import("../../prelude").EarlyErrorPrelude,
 *   { [k in import("../../../estree").PrivateKey]?: import(".").DryPrivateBinding },
 * >}
 */
const reduceBindingEntry = ({ path }, entries) => {
  /**
   * @type {{ [k in import("../../../estree").PrivateKey]?: import(".").DryPrivateBinding }}
   */
  const record = {};
  for (const [key, new_binding] of entries) {
    if (hasOwn(record, key)) {
      const old_binding = record[key];
      const binding = mergeBinding(old_binding, new_binding);
      if (binding === null) {
        return initSequence(
          [
            makeEarlyErrorPrelude(
              makeRegularEarlyError(`Duplicate private field #${key}`, path),
            ),
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
 *   frame: {
 *     singleton: import("../../cache").WritableCache,
 *     collection: import("../../cache").Cache,
 *   },
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
 * @type {(
 *   site: import("../../site").LeafSite,
 *   entries: import(".").RawPrivateFrame,
 * ) => import("../../../sequence.js").Sequence<
 *   (
 *     | import("../../prelude").MetaDeclarationPrelude
 *     | import("../../prelude").EarlyErrorPrelude
 *     | import("../../prelude").PrefixPrelude
 *   ),
 *   import(".").PrivateFrame,
 * >}
 */
export const setupPrivateFrame = ({ path, meta }, entries) =>
  bindSequence(
    cacheWritable(forkMeta((meta = nextMeta(meta))), "aran.deadzone"),
    (singleton) =>
      bindSequence(
        cacheConstant(
          forkMeta((meta = nextMeta(meta))),
          makeConstructExpression(
            makeIntrinsicExpression("WeakSet", path),
            [],
            path,
          ),
          path,
        ),
        (collection) =>
          bindSequence(
            flatSequence(
              map(entries, ([key, kind]) =>
                mapSequence(
                  setupBinding(
                    { path, meta: forkMeta((meta = nextMeta(meta))) },
                    kind,
                  ),
                  (binding) => pairup(key, binding),
                ),
              ),
            ),
            (entries) =>
              mapSequence(reduceBindingEntry({ path }, entries), (record) => ({
                type: "private",
                singleton,
                collection,
                record,
              })),
          ),
      ),
  );

/**
 * @type {(
 *   site: import("../../site").LeafSite,
 *   frame: import(".").PrivateFrame,
 *   operation: import("../operation").PrivateSaveOperation,
 * ) => null | import("../../../sequence").Sequence<
 *   import("../../prelude").MetaDeclarationPrelude,
 *   import("../../atom").Effect[],
 * >}
 */
export const listPrivateSaveEffect = ({ path, meta }, frame, operation) => {
  if (operation.type === "register-private-collection") {
    return incorporatePrefixEffect(
      mapSequence(
        cacheConstant(
          forkMeta((meta = nextMeta(meta))),
          operation.target,
          path,
        ),
        (target) => [
          makeConditionalEffect(
            makeApplyExpression(
              makeIntrinsicExpression("WeakSet.prototype.has", path),
              makeReadCacheExpression(frame.collection, path),
              [makeReadCacheExpression(target, path)],
              path,
            ),
            [
              makeExpressionEffect(
                makeThrowErrorExpression(
                  "TypeError",
                  "Duplicate private registration",
                  path,
                ),
                path,
              ),
            ],
            [
              makeExpressionEffect(
                makeApplyExpression(
                  makeIntrinsicExpression("WeakSet.prototype.add", path),
                  makeReadCacheExpression(frame.collection, path),
                  [makeReadCacheExpression(target, path)],
                  path,
                ),
                path,
              ),
            ],
            path,
          ),
        ],
      ),
      path,
    );
  } else if (operation.type === "register-private-singleton") {
    return zeroSequence([
      makeConditionalEffect(
        makeBinaryExpression(
          "!==",
          makeReadCacheExpression(frame.singleton, path),
          makeIntrinsicExpression("aran.deadzone", path),
          path,
        ),
        [
          makeExpressionEffect(
            makeThrowErrorExpression(
              "TypeError",
              "Duplicate private registration",
              path,
            ),
            path,
          ),
        ],
        [makeWriteCacheEffect(frame.singleton, operation.target, path)],
        path,
      ),
    ]);
  } else if (
    operation.type === "set-private" ||
    operation.type === "define-private" ||
    operation.type === "initialize-private"
  ) {
    if (hasOwn(frame.record, operation.key)) {
      return listBindingSaveEffect(
        { path, meta },
        hydrateBinding(frame.record[operation.key], frame),
        operation,
      );
    } else {
      return null;
    }
  } else {
    throw new AranTypeError(operation);
  }
};

/**
 * @type {(
 *   site: import("../../site").LeafSite,
 *   frame: import(".").PrivateFrame,
 *   operation: import("../operation").PrivateLoadOperation,
 * ) => null | import("../../../sequence").Sequence<
 *   import("../../prelude").MetaDeclarationPrelude,
 *   import("../../atom").Expression,
 * >}
 */
export const makePrivateLoadExpression = ({ path, meta }, frame, operation) => {
  if (hasOwn(frame.record, operation.key)) {
    return makeBindingLoadExpression(
      { path, meta },
      hydrateBinding(frame.record[operation.key], frame),
      operation,
    );
  } else {
    return null;
  }
};
