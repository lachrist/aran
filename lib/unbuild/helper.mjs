import { guard } from "../util/index.mjs";
import { makeReadCacheExpression, listWriteCacheEffect } from "./cache.mjs";
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

/**
 * @type {(
 *   site: {
 *     path: unbuild.Path,
 *   },
 *   options: {
 *     value: import("./cache").Cache,
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
 *     value: import("./cache").Cache,
 *   },
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeIsConstructorExpression = ({ path }, { value }) =>
  makeConditionalExpression(
    makeBinaryExpression(
      "===",
      makeUnaryExpression("typeof", makeReadCacheExpression(value, path), path),
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
  );

/**
 * @type {(
 *   site: {
 *     path: unbuild.Path,
 *   },
 *   options: {
 *     iterator: import("./cache").Cache,
 *     step: import("./cache").WritableCache,
 *   },
 * ) => aran.Effect<unbuild.Atom>[]}
 */
export const listReturnIteratorEffect = ({ path }, { iterator, step }) => [
  makeConditionalEffect(
    makeGetExpression(
      makeReadCacheExpression(step, path),
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
          ...listWriteCacheEffect(
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
            makeIsProperObjectExpression({ path }, { value: step }),
            [],
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
];

/**
 * @type {(
 *   site: {
 *     path: unbuild.Path,
 *   },
 *   options: {
 *     asynchronous: boolean,
 *     iterator: import("./cache").Cache,
 *     next: import("./cache").Cache,
 *     step: import("./cache").WritableCache,
 *   },
 * ) => aran.Effect<unbuild.Atom>[]}
 */
export const listNextIteratorEffect = (
  { path },
  { asynchronous, iterator, next, step },
) => [
  ...listWriteCacheEffect(
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
    makeIsProperObjectExpression({ path }, { value: step }),
    [],
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
];
