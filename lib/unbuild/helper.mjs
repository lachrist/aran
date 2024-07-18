import { concat_, EMPTY, guard } from "../util/index.mjs";
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
import {
  bindSequence,
  liftSequence__X_,
  liftSequenceX,
  mapSequence,
} from "../sequence.mjs";
import { incorporateEffect, incorporateExpression } from "./prelude/index.mjs";
import { forkMeta, nextMeta } from "./meta.mjs";
import { makeSequenceExpression } from "../node.mjs";

/**
 * @type {(
 *   site: import("./site").VoidSite,
 *   options: {
 *     value: import("./cache").Cache,
 *   },
 * ) => import("./atom").Expression}
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
 *   site: import("./site").LeafSite,
 *   options: {
 *     iterator: import("./cache").Cache,
 *   },
 * ) => import("../sequence").Sequence<
 *   import("./prelude").MetaDeclarationPrelude,
 *   import("./atom").Effect[],
 * >}
 */
export const listReturnIteratorEffect = ({ path, meta }, { iterator }) =>
  incorporateEffect(
    bindSequence(
      cacheConstant(
        forkMeta((meta = nextMeta(meta))),
        makeGetExpression(
          makeReadCacheExpression(iterator, path),
          makePrimitiveExpression("return", path),
          path,
        ),
        path,
      ),
      (method) =>
        liftSequenceX(
          concat_,
          liftSequence__X_(
            makeConditionalEffect,
            makeBinaryExpression(
              "==",
              makeReadCacheExpression(method, path),
              makePrimitiveExpression(null, path),
              path,
            ),
            EMPTY,
            incorporateEffect(
              mapSequence(
                cacheConstant(
                  forkMeta((meta = nextMeta(meta))),
                  makeApplyExpression(
                    makeReadCacheExpression(method, path),
                    makeReadCacheExpression(iterator, path),
                    [],
                    path,
                  ),
                  path,
                ),
                (result) => [
                  makeConditionalEffect(
                    makeIsProperObjectExpression({ path }, { value: result }),
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
              ),
              path,
            ),
            path,
          ),
        ),
    ),
    path,
  );

/**
 * @type {(
 *   site: import("./site").LeafSite,
 *   options: {
 *     asynchronous: boolean,
 *     iterator: import("./cache").Cache,
 *     next: import("./cache").Cache,
 *     done: import("./cache").WritableCache,
 *   },
 * ) => import("../sequence").Sequence<
 *   import("./prelude").MetaDeclarationPrelude,
 *   import("./atom").Expression,
 * >}
 */
export const makeNextIteratorExpression = (
  { path, meta },
  { asynchronous, iterator, next, done },
) =>
  liftSequence__X_(
    makeConditionalExpression,
    makeReadCacheExpression(done, path),
    makeIntrinsicExpression("undefined", path),
    incorporateExpression(
      mapSequence(
        cacheConstant(
          forkMeta((meta = nextMeta(meta))),
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
        (step) =>
          makeConditionalExpression(
            makeIsProperObjectExpression({ path }, { value: step }),
            makeSequenceExpression(
              [
                makeWriteCacheEffect(
                  done,
                  guard(
                    asynchronous,
                    (node) => makeAwaitExpression(node, path),
                    makeGetExpression(
                      makeReadCacheExpression(step, path),
                      makePrimitiveExpression("done", path),
                      path,
                    ),
                  ),
                  path,
                ),
              ],
              makeConditionalExpression(
                makeReadCacheExpression(done, path),
                makeIntrinsicExpression("undefined", path),
                guard(
                  asynchronous,
                  (node) => makeAwaitExpression(node, path),
                  makeGetExpression(
                    makeReadCacheExpression(step, path),
                    makePrimitiveExpression("value", path),
                    path,
                  ),
                ),
                path,
              ),
              path,
            ),
            makeThrowErrorExpression(
              "TypeError",
              "iterable.next() should return a proper object",
              path,
            ),
            path,
          ),
      ),
      path,
    ),
    path,
  );

/**
 * @type {(
 *   site: import("./site").LeafSite,
 *   options: {
 *     asynchronous: boolean,
 *     iterator: import("./cache").Cache,
 *     next: import("./cache").Cache,
 *     done: import("./cache").WritableCache,
 *   },
 * ) => import("../sequence").Sequence<
 *   import("./prelude").MetaDeclarationPrelude,
 *   import("./atom").Effect[],
 * >}
 */
export const listNextIteratorEffect = (
  { path, meta },
  { asynchronous, iterator, next, done },
) =>
  liftSequenceX(
    concat_,
    liftSequence__X_(
      makeConditionalEffect,
      makeReadCacheExpression(done, path),
      EMPTY,
      incorporateEffect(
        mapSequence(
          cacheConstant(
            forkMeta((meta = nextMeta(meta))),
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
          (step) => [
            makeConditionalEffect(
              makeIsProperObjectExpression({ path }, { value: step }),
              [
                makeWriteCacheEffect(
                  done,
                  guard(
                    asynchronous,
                    (node) => makeAwaitExpression(node, path),
                    makeGetExpression(
                      makeReadCacheExpression(step, path),
                      makePrimitiveExpression("done", path),
                      path,
                    ),
                  ),
                  path,
                ),
              ],
              [
                makeExpressionEffect(
                  makeThrowErrorExpression(
                    "TypeError",
                    "iterable.next() should return a proper object",
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
      ),
      path,
    ),
  );
