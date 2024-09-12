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
  listBindingSaveEffect,
  makeBindingLoadExpression,
  setupBinding,
} from "./binding.mjs";
import {
  isPrivateLoadOperation,
  isPrivateSaveOperation,
} from "../operation.mjs";

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
 *   import("../../prelude").SyntaxErrorPrelude,
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
            {
              type: "syntax-error",
              data: {
                message: `Duplicate private field #${key}`,
                origin: path,
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
 *     | import("../../prelude").SyntaxErrorPrelude
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
 * @type {import("../operation").ListFrameEffect<
 *   import(".").PrivateFrame
 * >}
 */
export const listPrivateSaveEffect = (
  site,
  frame,
  operation,
  alternate,
  context,
) => {
  if (operation.type === "register-private-collection") {
    let { path, meta } = site;
    return incorporateEffect(
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
    let { meta, path } = site;
    return incorporateEffect(
      mapSequence(
        cacheConstant(
          forkMeta((meta = nextMeta(meta))),
          operation.target,
          path,
        ),
        (target) => [
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
            [
              makeWriteCacheEffect(
                frame.singleton,
                makeReadCacheExpression(target, path),
                path,
              ),
            ],
            path,
          ),
        ],
      ),
      path,
    );
  } else {
    if (
      isPrivateSaveOperation(operation) &&
      hasOwn(frame.record, operation.key)
    ) {
      return listBindingSaveEffect(
        site,
        hydrateBinding(frame.record[operation.key], frame),
        operation,
      );
    } else {
      return alternate(site, context, operation);
    }
  }
};

/**
 * @type {import("../operation").MakeFrameExpression<
 *   import(".").PrivateFrame
 * >}
 */
export const makePrivateLoadExpression = (
  site,
  frame,
  operation,
  makeAlternateExpression,
  context,
) => {
  if (
    isPrivateLoadOperation(operation) &&
    hasOwn(frame.record, operation.key)
  ) {
    return makeBindingLoadExpression(
      site,
      hydrateBinding(frame.record[operation.key], frame),
      operation,
    );
  } else {
    return makeAlternateExpression(site, context, operation);
  }
};
