import { makeSyntaxErrorExpression } from "../report.mjs";
import { hasOwn, AranTypeError } from "../../util/index.mjs";
import { makeThrowErrorExpression } from "../intrinsic.mjs";
import {
  makeApplyExpression,
  makeConditionalExpression,
  makeExpressionEffect,
  makeIntrinsicExpression,
  makePrimitiveExpression,
  makeReadParameterExpression,
} from "../node.mjs";
import { makeInitCacheExpression, makeReadCacheExpression } from "../cache.mjs";
import { splitMeta } from "../mangle.mjs";

/**
 * @typedef {import("../cache.mjs").Cache} Cache
 */

/**
 * @type {(
 *   context: {},
 *   original: aran.Expression<unbuild.Atom>,
 *   shadow: aran.Expression<unbuild.Atom>,
 *   site: {
 *     path: unbuild.Path,
 *   },
 * ) => aran.Effect<unbuild.Atom>[]}
 */
export const listDeclarePrivateEffect = (
  _context,
  original,
  shadow,
  { path },
) => [
  makeExpressionEffect(
    makeApplyExpression(
      makeIntrinsicExpression("WeakMap.prototype.set", path),
      makeIntrinsicExpression("aran.private", path),
      [original, shadow],
      path,
    ),
    path,
  ),
];

/**
 * @type {(
 *   context: {
 *     privates: { [k in estree.PrivateKey]?: Cache },
 *   },
 *   object: aran.Expression<unbuild.Atom>,
 *   key: estree.PrivateKey,
 *   descriptor: aran.Expression<unbuild.Atom>,
 *   site: {
 *     path: unbuild.Path,
 *   },
 * ) => aran.Effect<unbuild.Atom>[]}
 */
export const listDefinePrivateEffect = (
  { privates: keys },
  object,
  key,
  descriptor,
  { path },
) =>
  hasOwn(keys, key)
    ? [
        makeExpressionEffect(
          makeApplyExpression(
            makeIntrinsicExpression("Reflect.defineProperty", path),
            makePrimitiveExpression({ undefined: null }, path),
            [
              makeApplyExpression(
                makeIntrinsicExpression("WeakMap.prototype.get", path),
                makeIntrinsicExpression("aran.private", path),
                [object],
                path,
              ),
              makeReadCacheExpression(
                /** @type {import("../cache.mjs").Cache} */ (keys[key]),
                path,
              ),
              descriptor,
            ],
            path,
          ),
          path,
        ),
      ]
    : [
        makeExpressionEffect(
          makeSyntaxErrorExpression(
            `Cannot define private member #${key}`,
            path,
          ),
          path,
        ),
      ];

/////////////////
// private.get //
/////////////////

/**
 * @type {(
 *   situ: "local" | "global",
 *   object: aran.Expression<unbuild.Atom>,
 *   key: estree.PrivateKey,
 *   site: {
 *     path: unbuild.Path,
 *   },
 * ) => aran.Expression<unbuild.Atom>}
 */
const makeMissingPrivateGetExpression = (situ, object, key, { path }) => {
  switch (situ) {
    case "global": {
      return makeSyntaxErrorExpression(`Missing private member #${key}`, path);
    }
    case "local": {
      return makeApplyExpression(
        makeReadParameterExpression("private.get", path),
        makePrimitiveExpression({ undefined: null }, path),
        [object, makePrimitiveExpression(key, path)],
        path,
      );
    }
    default: {
      throw new AranTypeError("invalid context.private.situ", situ);
    }
  }
};

/**
 * @type {(
 *   object: aran.Expression<unbuild.Atom>,
 *   key: {
 *     name: estree.PrivateKey,
 *     cache: import("../cache.mjs").Cache,
 *   },
 *   site: {
 *     path: unbuild.Path,
 *     meta: unbuild.Meta,
 *   },
 * ) => aran.Expression<unbuild.Atom>}
 */
const makePresentPrivateGetExpression = (object, key, { path, meta }) => {
  const metas = splitMeta(meta, ["original", "shadow"]);
  return makeInitCacheExpression(
    "constant",
    object,
    { path, meta: metas.original },
    (original) =>
      makeInitCacheExpression(
        "constant",
        makeApplyExpression(
          makeIntrinsicExpression("WeakMap.prototype.get", path),
          makeIntrinsicExpression("aran.private", path),
          [makeReadCacheExpression(original, path)],
          path,
        ),
        { path, meta: metas.shadow },
        (shadow) =>
          makeConditionalExpression(
            makeConditionalExpression(
              makeReadCacheExpression(shadow, path),
              makeApplyExpression(
                makeIntrinsicExpression("Reflect.has", path),
                makePrimitiveExpression({ undefined: null }, path),
                [
                  makeReadCacheExpression(shadow, path),
                  makeReadCacheExpression(key.cache, path),
                ],
                path,
              ),
              makePrimitiveExpression(false, path),
              path,
            ),
            makeApplyExpression(
              makeIntrinsicExpression("Reflect.get", path),
              makePrimitiveExpression({ undefined: null }, path),
              [
                makeReadCacheExpression(shadow, path),
                makeReadCacheExpression(key.cache, path),
                makeReadCacheExpression(original, path),
              ],
              path,
            ),
            makeThrowErrorExpression(
              "TypeError",
              `Cannot get private member #${key.name}`,
              path,
            ),
            path,
          ),
      ),
  );
};

/**
 * @type {(
 *   context: {
 *     root: {
 *       situ: "global" | "local",
 *     },
 *     privates: { [k in estree.PrivateKey]?: Cache },
 *   },
 *   object: aran.Expression<unbuild.Atom>,
 *   key: estree.PrivateKey,
 *   site: {
 *     path: unbuild.Path,
 *     meta: unbuild.Meta,
 *   },
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeGetPrivateExpression = (
  { root: { situ }, privates: keys },
  object,
  key,
  { path, meta },
) =>
  hasOwn(keys, key)
    ? makePresentPrivateGetExpression(
        object,
        {
          name: key,
          cache: /** @type {import("../cache.mjs").Cache} */ (keys[key]),
        },
        { path, meta },
      )
    : makeMissingPrivateGetExpression(situ, object, key, { path });

/////////////////
// private.set //
/////////////////

/**
 * @type {(
 *   situ: "local" | "global",
 *   object: aran.Expression<unbuild.Atom>,
 *   key: estree.PrivateKey,
 *   value: aran.Expression<unbuild.Atom>,
 *   site: {
 *     path: unbuild.Path,
 *   },
 * ) => aran.Expression<unbuild.Atom>}
 */
const makeMissingPrivateSetExpression = (
  situ,
  object,
  key,
  value,
  { path },
) => {
  switch (situ) {
    case "global": {
      return makeSyntaxErrorExpression(`Missing private member #${key}`, path);
    }
    case "local": {
      return makeApplyExpression(
        makeReadParameterExpression("private.set", path),
        makePrimitiveExpression({ undefined: null }, path),
        [object, makePrimitiveExpression(key, path), value],
        path,
      );
    }
    default: {
      throw new AranTypeError("invalid context.private.situ", situ);
    }
  }
};

/**
 * @type {(
 *   object: aran.Expression<unbuild.Atom>,
 *   key: {
 *     name: string,
 *     cache: import("../cache.mjs").Cache,
 *   },
 *   value: aran.Expression<unbuild.Atom>,
 *   site: {
 *     path: unbuild.Path,
 *     meta: unbuild.Meta,
 *   },
 * ) => aran.Expression<unbuild.Atom>}
 */
const makePresentPrivateSetExpression = (
  object,
  key,
  value,
  { path, meta },
) => {
  const metas = splitMeta(meta, ["original", "shadow"]);
  return makeInitCacheExpression(
    "constant",
    object,
    { path, meta: metas.original },
    (original) =>
      makeInitCacheExpression(
        "constant",
        makeApplyExpression(
          makeIntrinsicExpression("WeakMap.prototype.get", path),
          makeIntrinsicExpression("aran.private", path),
          [makeReadCacheExpression(original, path)],
          path,
        ),
        { path, meta: metas.shadow },
        (shadow) =>
          makeConditionalExpression(
            makeConditionalExpression(
              makeReadCacheExpression(shadow, path),
              makeApplyExpression(
                makeIntrinsicExpression("Reflect.has", path),
                makePrimitiveExpression({ undefined: null }, path),
                [
                  makeReadCacheExpression(shadow, path),
                  makeReadCacheExpression(key.cache, path),
                ],
                path,
              ),
              makePrimitiveExpression(false, path),
              path,
            ),
            makeApplyExpression(
              makeIntrinsicExpression("Reflect.set", path),
              makePrimitiveExpression({ undefined: null }, path),
              [
                makeReadCacheExpression(shadow, path),
                makeReadCacheExpression(key.cache, path),
                value,
                makeReadCacheExpression(original, path),
              ],
              path,
            ),
            makeThrowErrorExpression(
              "TypeError",
              `Cannot set private member #${key.name}`,
              path,
            ),
            path,
          ),
      ),
  );
};

/**
 * @type {(
 *   context: {
 *     root: {
 *       situ: "global" | "local",
 *     },
 *     privates: { [k in estree.PrivateKey]?: Cache },
 *   },
 *   object: aran.Expression<unbuild.Atom>,
 *   key: estree.PrivateKey,
 *   value: aran.Expression<unbuild.Atom>,
 *   site: {
 *     path: unbuild.Path,
 *     meta: unbuild.Meta,
 *   },
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeSetPrivateExpression = (
  { root: { situ }, privates: keys },
  object,
  key,
  value,
  { path, meta },
) =>
  hasOwn(keys, key)
    ? makePresentPrivateSetExpression(
        object,
        {
          name: key,
          cache: /** @type {import("../cache.mjs").Cache}*/ (keys[key]),
        },
        value,
        { path, meta },
      )
    : makeMissingPrivateSetExpression(situ, object, key, value, { path });

/**
 * @type {(
 *   context: {
 *     root: {
 *       situ: "global" | "local",
 *     },
 *     privates: { [k in estree.PrivateKey]?: Cache },
 *   },
 *   object: aran.Expression<unbuild.Atom>,
 *   key: estree.PrivateKey,
 *   value: aran.Expression<unbuild.Atom>,
 *   site: {
 *     path: unbuild.Path,
 *     meta: unbuild.Meta,
 *   },
 * ) => aran.Effect<unbuild.Atom>[]}
 */
export const listSetPrivateEffect = (
  context,
  object,
  key,
  value,
  { path, meta },
) => [
  makeExpressionEffect(
    makeSetPrivateExpression(context, object, key, value, { path, meta }),
    path,
  ),
];
