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
 *   hash: import("../hash").Hash,
 *   options: {
 *     value: import("./cache").Cache,
 *   },
 * ) => import("./atom").Expression}
 */
export const makeIsProperObjectExpression = (hash, { value }) =>
  makeConditionalExpression(
    makeBinaryExpression(
      "===",
      makeUnaryExpression("typeof", makeReadCacheExpression(value, hash), hash),
      makePrimitiveExpression("object", hash),
      hash,
    ),
    makeBinaryExpression(
      "!==",
      makeReadCacheExpression(value, hash),
      makePrimitiveExpression(null, hash),
      hash,
    ),
    makeBinaryExpression(
      "===",
      makeUnaryExpression("typeof", makeReadCacheExpression(value, hash), hash),
      makePrimitiveExpression("function", hash),
      hash,
    ),
    hash,
  );

/**
 * @type {(
 *   hash: import("../hash").Hash,
 *   meta: import("./meta").Meta,
 *   options: {
 *     iterator: import("./cache").Cache,
 *   },
 * ) => import("../sequence").Sequence<
 *   import("./prelude").MetaDeclarationPrelude,
 *   import("./atom").Effect[],
 * >}
 */
export const listReturnIteratorEffect = (hash, meta, { iterator }) =>
  incorporateEffect(
    bindSequence(
      cacheConstant(
        forkMeta((meta = nextMeta(meta))),
        makeGetExpression(
          makeReadCacheExpression(iterator, hash),
          makePrimitiveExpression("return", hash),
          hash,
        ),
        hash,
      ),
      (method) =>
        liftSequenceX(
          concat_,
          liftSequence__X_(
            makeConditionalEffect,
            makeBinaryExpression(
              "==",
              makeReadCacheExpression(method, hash),
              makePrimitiveExpression(null, hash),
              hash,
            ),
            EMPTY,
            incorporateEffect(
              mapSequence(
                cacheConstant(
                  forkMeta((meta = nextMeta(meta))),
                  makeApplyExpression(
                    makeReadCacheExpression(method, hash),
                    makeReadCacheExpression(iterator, hash),
                    [],
                    hash,
                  ),
                  hash,
                ),
                (result) => [
                  makeConditionalEffect(
                    makeIsProperObjectExpression(hash, { value: result }),
                    EMPTY,
                    [
                      makeExpressionEffect(
                        makeThrowErrorExpression(
                          "TypeError",
                          "iterable.return() should return a proper object",
                          hash,
                        ),
                        hash,
                      ),
                    ],
                    hash,
                  ),
                ],
              ),
              hash,
            ),
            hash,
          ),
        ),
    ),
    hash,
  );

/**
 * @type {(
 *   hash: import("../hash").Hash,
 *   meta: import("./meta").Meta,
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
  hash,
  meta,
  { asynchronous, iterator, next, done },
) =>
  liftSequence__X_(
    makeConditionalExpression,
    makeReadCacheExpression(done, hash),
    makeIntrinsicExpression("undefined", hash),
    incorporateExpression(
      mapSequence(
        cacheConstant(
          forkMeta((meta = nextMeta(meta))),
          guard(
            asynchronous,
            (node) => makeAwaitExpression(node, hash),
            makeApplyExpression(
              makeReadCacheExpression(next, hash),
              makeReadCacheExpression(iterator, hash),
              [],
              hash,
            ),
          ),
          hash,
        ),
        (step) =>
          makeConditionalExpression(
            makeIsProperObjectExpression(hash, { value: step }),
            makeSequenceExpression(
              [
                makeWriteCacheEffect(
                  done,
                  guard(
                    asynchronous,
                    (node) => makeAwaitExpression(node, hash),
                    makeGetExpression(
                      makeReadCacheExpression(step, hash),
                      makePrimitiveExpression("done", hash),
                      hash,
                    ),
                  ),
                  hash,
                ),
              ],
              makeConditionalExpression(
                makeReadCacheExpression(done, hash),
                makeIntrinsicExpression("undefined", hash),
                guard(
                  asynchronous,
                  (node) => makeAwaitExpression(node, hash),
                  makeGetExpression(
                    makeReadCacheExpression(step, hash),
                    makePrimitiveExpression("value", hash),
                    hash,
                  ),
                ),
                hash,
              ),
              hash,
            ),
            makeThrowErrorExpression(
              "TypeError",
              "iterable.next() should return a proper object",
              hash,
            ),
            hash,
          ),
      ),
      hash,
    ),
    hash,
  );

/**
 * @type {(
 *   hash: import("../hash").Hash,
 *   meta: import("./meta").Meta,
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
  hash,
  meta,
  { asynchronous, iterator, next, done },
) =>
  liftSequenceX(
    concat_,
    liftSequence__X_(
      makeConditionalEffect,
      makeReadCacheExpression(done, hash),
      EMPTY,
      incorporateEffect(
        mapSequence(
          cacheConstant(
            forkMeta((meta = nextMeta(meta))),
            guard(
              asynchronous,
              (node) => makeAwaitExpression(node, hash),
              makeApplyExpression(
                makeReadCacheExpression(next, hash),
                makeReadCacheExpression(iterator, hash),
                [],
                hash,
              ),
            ),
            hash,
          ),
          (step) => [
            makeConditionalEffect(
              makeIsProperObjectExpression(hash, { value: step }),
              [
                makeWriteCacheEffect(
                  done,
                  guard(
                    asynchronous,
                    (node) => makeAwaitExpression(node, hash),
                    makeGetExpression(
                      makeReadCacheExpression(step, hash),
                      makePrimitiveExpression("done", hash),
                      hash,
                    ),
                  ),
                  hash,
                ),
              ],
              [
                makeExpressionEffect(
                  makeThrowErrorExpression(
                    "TypeError",
                    "iterable.next() should return a proper object",
                    hash,
                  ),
                  hash,
                ),
              ],
              hash,
            ),
          ],
        ),
        hash,
      ),
      hash,
    ),
  );
