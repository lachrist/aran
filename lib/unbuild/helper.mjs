import { EMPTY, guard } from "../util/index.mjs";
import {
  makeReadCacheExpression,
  makeWriteCacheEffect,
  cacheConstant,
} from "./cache.mjs";
import {
  makeBinaryExpression,
  makeGetExpression,
  makeThrowErrorExpression,
  makeUnaryExpression,
} from "./intrinsic.mjs";
import {
  makeApplyExpression,
  makeAwaitExpression,
  makeConditionalEffect,
  makeConditionalExpression,
  makeExpressionEffect,
  makeIntrinsicExpression,
  makePrimitiveExpression,
} from "./node.mjs";
import { mapSequence, zeroSequence } from "./sequence.mjs";
import { cleanupExpression } from "./cleanup.mjs";

/**
 * @type {(
 *   site: import("./site").LeafSite,
 *   options: {
 *     value: aran.Expression<unbuild.Atom>,
 *   },
 * ) => import("./sequence").Sequence<
 *   import("./prelude").MetaDeclarationPrelude,
 *   aran.Expression<unbuild.Atom>,
 * >}
 */
export const makeIsProperObjectExpression = ({ path, meta }, { value }) =>
  cleanupExpression(
    mapSequence(cacheConstant(meta, value, path), (cache) =>
      makeConditionalExpression(
        makeBinaryExpression(
          "===",
          makeUnaryExpression(
            "typeof",
            makeReadCacheExpression(cache, path),
            path,
          ),
          makePrimitiveExpression("object", path),
          path,
        ),
        makeBinaryExpression(
          "!==",
          makeReadCacheExpression(cache, path),
          makePrimitiveExpression(null, path),
          path,
        ),
        makeBinaryExpression(
          "===",
          makeUnaryExpression(
            "typeof",
            makeReadCacheExpression(cache, path),
            path,
          ),
          makePrimitiveExpression("function", path),
          path,
        ),
        path,
      ),
    ),
    path,
  );

/**
 * @type {(
 *   site: import("./site").VoidSite,
 *   options: {
 *     value: import("./cache").Cache,
 *   },
 * ) => import("./sequence").Sequence<
 *   never,
 *   aran.Expression<unbuild.Atom>,
 * >}
 */
export const makeIsConstructorExpression = ({ path }, { value }) =>
  zeroSequence(
    makeConditionalExpression(
      makeBinaryExpression(
        "===",
        makeUnaryExpression(
          "typeof",
          makeReadCacheExpression(value, path),
          path,
        ),
        makePrimitiveExpression("function", path),
        path,
      ),
      makeConditionalExpression(
        makeApplyExpression(
          makeIntrinsicExpression("Object.hasOwn", path),
          makePrimitiveExpression({ undefined: null }, path),
          [
            makeReadCacheExpression(value, path),
            makePrimitiveExpression("prototype", path),
          ],
          path,
        ),
        makeBinaryExpression(
          "!==",
          makeGetExpression(
            makeReadCacheExpression(value, path),
            makePrimitiveExpression("prototype", path),
            path,
          ),
          makePrimitiveExpression({ undefined: null }, path),
          path,
        ),
        makePrimitiveExpression(false, path),
        path,
      ),
      makePrimitiveExpression(false, path),
      path,
    ),
  );

/**
 * @type {(
 *   site: import("./site").LeafSite,
 *   options: {
 *     iterator: import("./cache").Cache,
 *     step: import("./cache").WritableCache,
 *   },
 * ) => import("./sequence").Sequence<
 *   import("./prelude").MetaDeclarationPrelude,
 *   aran.Effect<unbuild.Atom>[],
 * >}
 */
export const listReturnIteratorEffect = ({ path, meta }, { iterator, step }) =>
  mapSequence(
    makeIsProperObjectExpression(
      { path, meta },
      { value: makeReadCacheExpression(step, path) },
    ),
    (is_proper_object) => [
      makeConditionalEffect(
        makeGetExpression(
          makeReadCacheExpression(step, path),
          makePrimitiveExpression("done", path),
          path,
        ),
        EMPTY,
        [
          makeConditionalEffect(
            makeBinaryExpression(
              "==",
              makeGetExpression(
                makeReadCacheExpression(iterator, path),
                makePrimitiveExpression("return", path),
                path,
              ),
              makePrimitiveExpression(null, path),
              path,
            ),
            EMPTY,
            [
              makeWriteCacheEffect(
                step,
                makeApplyExpression(
                  makeGetExpression(
                    makeReadCacheExpression(iterator, path),
                    makePrimitiveExpression("return", path),
                    path,
                  ),
                  makeReadCacheExpression(iterator, path),
                  [],
                  path,
                ),
                path,
              ),
              makeConditionalEffect(
                is_proper_object,
                EMPTY,
                [
                  makeExpressionEffect(
                    makeThrowErrorExpression(
                      "TypeError",
                      "iterable.return() should return a proper object",
                      path,
                    ),
                    path,
                  ),
                ],
                path,
              ),
            ],
            path,
          ),
        ],
        path,
      ),
    ],
  );

/**
 * @type {(
 *   site: import("./site").LeafSite,
 *   options: {
 *     asynchronous: boolean,
 *     iterator: import("./cache").Cache,
 *     next: import("./cache").Cache,
 *     step: import("./cache").WritableCache,
 *   },
 * ) => import("./sequence").Sequence<
 *   import("./prelude").MetaDeclarationPrelude,
 *   aran.Effect<unbuild.Atom>[],
 * >}
 */
export const listNextIteratorEffect = (
  { path, meta },
  { asynchronous, iterator, next, step },
) =>
  mapSequence(
    makeIsProperObjectExpression(
      { path, meta },
      { value: makeReadCacheExpression(step, path) },
    ),
    (is_proper_object) => [
      makeWriteCacheEffect(
        step,
        guard(
          asynchronous,
          (node) => makeAwaitExpression(node, path),
          makeApplyExpression(
            makeReadCacheExpression(next, path),
            makeReadCacheExpression(iterator, path),
            [],
            path,
          ),
        ),
        path,
      ),
      makeConditionalEffect(
        is_proper_object,
        EMPTY,
        [
          makeExpressionEffect(
            makeThrowErrorExpression(
              "TypeError",
              "iterator.next() should return a proper object",
              path,
            ),
            path,
          ),
        ],
        path,
      ),
    ],
  );
