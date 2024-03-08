import { guard, some } from "../util/index.mjs";
import {
  makeReadCacheExpression,
  listWriteCacheEffect,
  cacheConstant,
} from "./cache.mjs";
import {
  makeBinaryExpression,
  makeGetExpression,
  makeThrowErrorExpression,
  makeUnaryExpression,
} from "./intrinsic.mjs";
import {
  EMPTY_EFFECT,
  concatEffect,
  makeApplyExpression,
  makeAwaitExpression,
  makeBlockStatement,
  makeConditionalEffect,
  makeConditionalExpression,
  makeControlBlock,
  makeExpressionEffect,
  makeIntrinsicExpression,
  makePrimitiveExpression,
} from "./node.mjs";
import { unprefixExpression } from "./prefix.mjs";
import { isBaseDeclarationPrelude } from "./prelude.mjs";
import { bindSequence } from "./sequence.mjs";

/**
 * @type {(
 *   labels: unbuild.Label[],
 *   body: import("./sequence").ControlBodySequence,
 *   tag: unbuild.Path,
 * ) => import("./sequence").StatementSequence}
 */
export const makeControlStatement = (labels, { head, tail }, tag) => {
  if (labels.length > 0 || some(head, isBaseDeclarationPrelude)) {
    return makeBlockStatement(
      makeControlBlock(labels, { head, tail }, tag),
      tag,
    );
  } else {
    // This may seem unsafe because it moves meta variables in parent scope.
    // But control flow only occurs in proper block.
    // So this can only be used in naked block and hence it is safe.
    return {
      // eslint-disable-next-line object-shorthand
      head: /** @type {import("./prelude").StatementPrelude[]} */ (head),
      tail: tail.content,
    };
  }
};

/**
 * @type {(
 *   site: import("./site").LeafSite,
 *   options: {
 *     value: import("./sequence").ExpressionSequence,
 *   },
 * ) => import("./sequence").ExpressionSequence}
 */
export const makeIsProperObjectExpression = ({ path, meta }, { value }) =>
  unprefixExpression(
    bindSequence(cacheConstant(meta, value, path), (value) =>
      makeConditionalExpression(
        makeBinaryExpression(
          "===",
          makeUnaryExpression(
            "typeof",
            makeReadCacheExpression(value, path),
            path,
          ),
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
          makeUnaryExpression(
            "typeof",
            makeReadCacheExpression(value, path),
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
 *   site: {
 *     path: unbuild.Path,
 *   },
 *   options: {
 *     value: import("./cache").Cache,
 *   },
 * ) => import("./sequence").ExpressionSequence}
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
 *   site: import("./site").LeafSite,
 *   options: {
 *     iterator: import("./cache").Cache,
 *     step: import("./cache").WritableCache,
 *   },
 * ) => import("./sequence").EffectSequence}
 */
export const listReturnIteratorEffect = ({ path, meta }, { iterator, step }) =>
  makeConditionalEffect(
    makeGetExpression(
      makeReadCacheExpression(step, path),
      makePrimitiveExpression("done", path),
      path,
    ),
    EMPTY_EFFECT,
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
      EMPTY_EFFECT,
      concatEffect([
        listWriteCacheEffect(
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
          makeIsProperObjectExpression(
            { path, meta },
            { value: makeReadCacheExpression(step, path) },
          ),
          EMPTY_EFFECT,
          makeExpressionEffect(
            makeThrowErrorExpression(
              "TypeError",
              "iterable.return() should return a proper object",
              path,
            ),
            path,
          ),
          path,
        ),
      ]),
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
 *     step: import("./cache").WritableCache,
 *   },
 * ) => import("./sequence").EffectSequence}
 */
export const listNextIteratorEffect = (
  { path, meta },
  { asynchronous, iterator, next, step },
) =>
  concatEffect([
    listWriteCacheEffect(
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
      makeIsProperObjectExpression(
        { path, meta },
        { value: makeReadCacheExpression(step, path) },
      ),
      EMPTY_EFFECT,
      makeExpressionEffect(
        makeThrowErrorExpression(
          "TypeError",
          "iterator.next() should return a proper object",
          path,
        ),
        path,
      ),
      path,
    ),
  ]);
