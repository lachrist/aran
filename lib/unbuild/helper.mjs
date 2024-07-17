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
  liftSequenceX___,
  mapSequence,
} from "../sequence.mjs";
import { incorporateEffect, incorporateExpression } from "./prelude/index.mjs";
import { forkMeta, nextMeta } from "./meta.mjs";
import { makeSequenceExpression } from "../node.mjs";

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
 *     done: import("./cache").Cache,
 *   },
 * ) => import("../sequence").Sequence<
 *   import("./prelude").MetaDeclarationPrelude,
 *   import("./atom").Effect[],
 * >}
 */
export const listReturnIteratorEffect = ({ path, meta }, { iterator, done }) =>
  liftSequenceX(
    concat_,
    liftSequence__X_(
      makeConditionalEffect,
      makeReadCacheExpression(done, path),
      EMPTY,
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
                  bindSequence(
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
                    (result) =>
                      liftSequenceX(
                        concat_,
                        liftSequenceX___(
                          makeConditionalEffect,
                          makeIsProperObjectExpression(
                            { path, meta: forkMeta((meta = nextMeta(meta))) },
                            { value: makeReadCacheExpression(result, path) },
                          ),
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
                      ),
                  ),
                  path,
                ),
                path,
              ),
            ),
        ),
        path,
      ),
      path,
    ),
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
      bindSequence(
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
          liftSequenceX___(
            makeConditionalExpression,
            makeIsProperObjectExpression(
              { path, meta: forkMeta((meta = nextMeta(meta))) },
              { value: makeReadCacheExpression(step, path) },
            ),
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
        bindSequence(
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
            liftSequenceX(
              concat_,
              liftSequenceX___(
                makeConditionalEffect,
                makeIsProperObjectExpression(
                  { path, meta: forkMeta((meta = nextMeta(meta))) },
                  { value: makeReadCacheExpression(step, path) },
                ),
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
            ),
        ),
        path,
      ),
      path,
    ),
  );
