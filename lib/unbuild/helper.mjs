import { makeReadCacheExpression, makeWriteCacheEffect } from "./cache.mjs";
import {
  makeBinaryExpression,
  makeGetExpression,
  makeThrowErrorExpression,
  makeUnaryExpression,
} from "./intrinsic.mjs";
import {
  makeApplyExpression,
  makeConditionalEffect,
  makeConditionalExpression,
  makeExpressionEffect,
  makePrimitiveExpression,
} from "./node.mjs";

/**
 * @type {(
 *   site: {
 *     path: unbuild.Path,
 *   },
 *   options: {
 *     value: import("./cache.mjs").Cache,
 *   },
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeIsProperObjectExpression = ({ path }, { value }) =>
  makeConditionalExpression(
    makeBinaryExpression(
      "===",
      makeUnaryExpression("typeof", makeReadCacheExpression(value, path), path),
      makePrimitiveExpression("object", path),
      path,
    ),
    makeBinaryExpression(
      "!==",
      makeReadCacheExpression(value, path),
      makePrimitiveExpression(null, path),
      path,
    ),
    makeBinaryExpression(
      "===",
      makeUnaryExpression("typeof", makeReadCacheExpression(value, path), path),
      makePrimitiveExpression("function", path),
      path,
    ),
    path,
  );

/**
 * @type {(
 *   site: {
 *     path: unbuild.Path,
 *   },
 *   options: {
 *     iterator: import("./cache.mjs").Cache,
 *     next: import("./cache.mjs").WritableCache,
 *   },
 * ) => aran.Effect<unbuild.Atom>[]}
 */
export const listNextIterableEffect = ({ path }, { iterator, next }) => [
  makeConditionalEffect(
    makeGetExpression(
      makeReadCacheExpression(next, path),
      makePrimitiveExpression("done", path),
      path,
    ),
    [],
    [
      makeWriteCacheEffect(
        next,
        makeApplyExpression(
          makeGetExpression(
            makeReadCacheExpression(iterator, path),
            makePrimitiveExpression("next", path),
            path,
          ),
          makeReadCacheExpression(iterator, path),
          [],
          path,
        ),
        path,
      ),
      makeConditionalEffect(
        makeIsProperObjectExpression({ path }, { value: next }),
        [],
        [
          makeExpressionEffect(
            makeThrowErrorExpression(
              "TypeError",
              "iteratable.next() should return a proper object",
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
];

/**
 * @type {(
 *   site: {
 *     path: unbuild.Path,
 *   },
 *   options: {
 *     iterator: import("./cache.mjs").Cache,
 *     next: import("./cache.mjs").WritableCache,
 *   },
 * ) => aran.Effect<unbuild.Atom>[]}
 */
export const listReturnIterableEffect = ({ path }, { iterator, next }) => [
  makeConditionalEffect(
    makeGetExpression(
      makeReadCacheExpression(next, path),
      makePrimitiveExpression("done", path),
      path,
    ),
    [],
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
        [],
        [
          makeWriteCacheEffect(
            next,
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
            makeIsProperObjectExpression({ path }, { value: next }),
            [],
            [
              makeExpressionEffect(
                makeThrowErrorExpression(
                  "TypeError",
                  "iteratable.return() should return a proper object",
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
];
