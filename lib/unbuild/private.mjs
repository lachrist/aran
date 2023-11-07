import { makeSyntaxErrorExpression } from "./report.mjs";
import { hasOwn } from "../util/index.mjs";
import {
  makeObjectExpression,
  makeThrowErrorExpression,
} from "./intrinsic.mjs";
import {
  makeApplyExpression,
  makeConditionalExpression,
  makeExpressionEffect,
  makeIntrinsicExpression,
  makePrimitiveExpression,
  makeReadExpression,
} from "./node.mjs";
import { makeInitCacheExpression, makeReadCacheExpression } from "./cache.mjs";

/**
 * @typedef {{
 *   [key in estree.PrivateKey]?: import("./cache.mjs").Cache
 * }} Private
 */

/**
 * @type {(
 *   context: import("./context.d.ts").Context,
 *   object: aran.Expression<unbuild.Atom>,
 *   path: unbuild.Path,
 * ) => aran.Effect<unbuild.Atom>[]}
 */
export const listDeclarePrivateEffect = (_context, object, path) => [
  makeExpressionEffect(
    makeApplyExpression(
      makeIntrinsicExpression("WeakMap.prototype.set", path),
      makeIntrinsicExpression("aran.private", path),
      [
        object,
        makeObjectExpression(
          makePrimitiveExpression({ undefined: null }, path),
          [],
          path,
        ),
      ],
      path,
    ),
    path,
  ),
];

/**
 * @type {(
 *   context: import("./context.d.ts").Context,
 *   object: aran.Expression<unbuild.Atom>,
 *   key: estree.PrivateKey,
 *   descriptor: aran.Expression<unbuild.Atom>,
 *   path: unbuild.Path,
 * ) => aran.Effect<unbuild.Atom>[]}
 */
export const listDefinePrivateEffect = (
  context,
  object,
  key,
  descriptor,
  path,
) =>
  hasOwn(context.private, key)
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
                /** @type {import("./cache.mjs").Cache} */ (
                  context.private[key]
                ),
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

/**
 * @type {(
 *   context: import("./context.d.ts").Context,
 *   object: aran.Expression<unbuild.Atom>,
 *   key: estree.PrivateKey,
 *   path: unbuild.Path,
 *   meta: unbuild.Meta,
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeGetPrivateExpression = (context, object, key, path, meta) =>
  hasOwn(context.private, key)
    ? makeInitCacheExpression("constant", object, { path, meta }, (object) =>
        makeConditionalExpression(
          makeConditionalExpression(
            makeApplyExpression(
              makeIntrinsicExpression("WeakMap.prototype.has", path),
              makeIntrinsicExpression("aran.private", path),
              [makeReadCacheExpression(object, path)],
              path,
            ),
            makeApplyExpression(
              makeIntrinsicExpression("Reflect.has", path),
              makePrimitiveExpression({ undefined: null }, path),
              [
                makeApplyExpression(
                  makeIntrinsicExpression("WeakMap.prototype.get", path),
                  makeIntrinsicExpression("aran.private", path),
                  [makeReadCacheExpression(object, path)],
                  path,
                ),
                makeReadCacheExpression(
                  /** @type {import("./cache.mjs").Cache} */ (
                    context.private[key]
                  ),
                  path,
                ),
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
              makeApplyExpression(
                makeIntrinsicExpression("WeakMap.prototype.get", path),
                makeIntrinsicExpression("aran.private", path),
                [makeReadCacheExpression(object, path)],
                path,
              ),
              makeReadCacheExpression(
                /** @type {import("./cache.mjs").Cache} */ (
                  context.private[key]
                ),
                path,
              ),
              makeReadCacheExpression(object, path),
            ],
            path,
          ),
          makeThrowErrorExpression(
            "TypeError",
            `Cannot read private member #${key}`,
            path,
          ),
          path,
        ),
      )
    : makeApplyExpression(
        makeReadExpression("private.get", path),
        makePrimitiveExpression({ undefined: null }, path),
        [object, makePrimitiveExpression(key, path)],
        path,
      );

/**
 * @type {(
 *   context: import("./context.d.ts").Context,
 *   object: aran.Expression<unbuild.Atom>,
 *   key: estree.PrivateKey,
 *   value: aran.Expression<unbuild.Atom>,
 *   path: unbuild.Path,
 *   meta: unbuild.Meta,
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeSetPrivateExpression = (
  context,
  object,
  key,
  value,
  path,
  meta,
) =>
  hasOwn(context.private, key)
    ? makeInitCacheExpression("constant", object, { path, meta }, (object) =>
        makeConditionalExpression(
          makeConditionalExpression(
            makeApplyExpression(
              makeIntrinsicExpression("WeakMap.prototype.has", path),
              makeIntrinsicExpression("aran.private", path),
              [makeReadCacheExpression(object, path)],
              path,
            ),
            makeApplyExpression(
              makeIntrinsicExpression("Reflect.has", path),
              makePrimitiveExpression({ undefined: null }, path),
              [
                makeApplyExpression(
                  makeIntrinsicExpression("WeakMap.prototype.get", path),
                  makeIntrinsicExpression("aran.private", path),
                  [makeReadCacheExpression(object, path)],
                  path,
                ),
                makeReadCacheExpression(
                  /** @type {import("./cache.mjs").Cache} */ (
                    context.private[key]
                  ),
                  path,
                ),
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
              makeApplyExpression(
                makeIntrinsicExpression("WeakMap.prototype.get", path),
                makeIntrinsicExpression("aran.private", path),
                [makeReadCacheExpression(object, path)],
                path,
              ),
              makeReadCacheExpression(
                /** @type {import("./cache.mjs").Cache} */ (
                  context.private[key]
                ),
                path,
              ),
              value,
              makeReadCacheExpression(object, path),
            ],
            path,
          ),
          makeThrowErrorExpression(
            "TypeError",
            `Cannot read private member #${key}`,
            path,
          ),
          path,
        ),
      )
    : makeApplyExpression(
        makeReadExpression("private.set", path),
        makePrimitiveExpression({ undefined: null }, path),
        [object, makePrimitiveExpression(key, path), value],
        path,
      );
