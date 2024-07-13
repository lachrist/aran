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
  makePrimitiveExpression,
} from "./node.mjs";
import { mapSequence } from "../sequence.mjs";
import { incorporateExpression } from "./prelude/index.mjs";

/**
 * @type {(
 *   site: import("./site").LeafSite,
 *   options: {
 *     value: import("./atom").Expression,
 *   },
 * ) => import("../sequence").Sequence<
 *   import("./prelude").MetaDeclarationPrelude,
 *   import("./atom").Expression,
 * >}
 */
export const makeIsProperObjectExpression = ({ path, meta }, { value }) =>
  incorporateExpression(
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
 *   site: import("./site").LeafSite,
 *   options: {
 *     iterator: import("./cache").Cache,
 *     step: import("./cache").WritableCache,
 *   },
 * ) => import("../sequence").Sequence<
 *   import("./prelude").MetaDeclarationPrelude,
 *   import("./atom").Effect[],
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
 * ) => import("../sequence").Sequence<
 *   import("./prelude").MetaDeclarationPrelude,
 *   import("./atom").Effect[],
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
