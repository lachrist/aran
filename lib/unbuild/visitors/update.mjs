import {
  concatEffect,
  makeApplyExpression,
  makeConditionalExpression,
  makeExpressionEffect,
  makeIntrinsicExpression,
  makePrimitiveExpression,
  makeSequenceExpression,
} from "../node.mjs";
import {
  makeBinaryExpression,
  makeThrowErrorExpression,
  makeUnaryExpression,
} from "../intrinsic.mjs";
import { unbuildEffect } from "./effect.mjs";
import { makeEarlyErrorExpression } from "../early-error.mjs";
import { unbuildObject } from "./object.mjs";
import { listSetMemberEffect, makeGetMemberExpression } from "../member.mjs";
import { bindSequence } from "../sequence.mjs";
import {
  getMode,
  listScopeSaveEffect,
  makeScopeLoadExpression,
} from "../scope/index.mjs";
import { drillSite } from "../site.mjs";
import { AranTypeError } from "../../error.mjs";
import { forkMeta, nextMeta } from "../meta.mjs";
import { unbuildKey } from "./key.mjs";
import { cacheConstant, makeReadCacheExpression } from "../cache.mjs";
import { duplicateObject } from "../object.mjs";
import { duplicateKey } from "../key.mjs";

/**
 * @type {Record<
 *   Exclude<estree.UpdateOperator | estree.AssignmentOperator, "=">,
 *   estree.LogicalOperator | estree.BinaryOperator
 * >}
 */
export const UPDATE_OPERATOR_RECORD = {
  "++": "+",
  "--": "-",
  "+=": "+",
  "-=": "-",
  "*=": "*",
  "/=": "/",
  "%=": "%",
  "**=": "**",
  "<<=": "<<",
  ">>=": ">>",
  ">>>=": ">>>",
  "&=": "&",
  "|=": "|",
  "^=": "^",
  "??=": "??",
  "||=": "||",
  "&&=": "&&",
};

/**
 * @type {(
 *   site: import("../site").LeafSite,
 *   options: {
 *     operator: estree.BinaryOperator | estree.LogicalOperator,
 *     left: import("../sequence").ExpressionSequence,
 *     right: import("../sequence").ExpressionSequence | null,
 *   },
 * ) => import("../sequence").ExpressionSequence}
 */
const makeIncrementExpression = ({ path, meta }, { operator, left, right }) => {
  if (operator === "||") {
    return bindSequence(cacheConstant(meta, left, path), (left) =>
      makeConditionalExpression(
        makeReadCacheExpression(left, path),
        makeReadCacheExpression(left, path),
        right === null
          ? makePrimitiveExpression({ undefined: null }, path)
          : right,
        path,
      ),
    );
  } else if (operator === "&&") {
    return bindSequence(cacheConstant(meta, left, path), (left) =>
      makeConditionalExpression(
        makeReadCacheExpression(left, path),
        makeReadCacheExpression(left, path),
        right === null
          ? makePrimitiveExpression({ undefined: null }, path)
          : right,
        path,
      ),
    );
  } else if (operator === "??") {
    return bindSequence(cacheConstant(meta, left, path), (left) =>
      makeConditionalExpression(
        makeBinaryExpression(
          "==",
          makeReadCacheExpression(left, path),
          makePrimitiveExpression(null, path),
          path,
        ),
        right === null
          ? makePrimitiveExpression({ undefined: null }, path)
          : right,
        makeReadCacheExpression(left, path),
        path,
      ),
    );
  } else {
    if (right === null) {
      return bindSequence(cacheConstant(meta, left, path), (left) =>
        makeConditionalExpression(
          makeBinaryExpression(
            "===",
            makeUnaryExpression(
              "typeof",
              makeReadCacheExpression(left, path),
              path,
            ),
            makePrimitiveExpression("bigint", path),
            path,
          ),
          makeBinaryExpression(
            operator,
            makeReadCacheExpression(left, path),
            makePrimitiveExpression({ bigint: "1" }, path),
            path,
          ),
          makeBinaryExpression(
            operator,
            makeApplyExpression(
              makeIntrinsicExpression("Number", path),
              makePrimitiveExpression({ undefined: null }, path),
              [makeReadCacheExpression(left, path)],
              path,
            ),
            makePrimitiveExpression(1, path),
            path,
          ),
          path,
        ),
      );
    } else {
      return makeBinaryExpression(operator, left, right, path);
    }
  }
};

/**
 * @type {(
 *   site: import("../site").Site<estree.Pattern | estree.Expression>,
 *   scope: import("../scope").Scope,
 *   options: {
 *     result: "new" | "old",
 *     operator: estree.BinaryOperator | estree.LogicalOperator,
 *     increment: import("../sequence").ExpressionSequence | null,
 *   },
 * ) => import("../sequence").ExpressionSequence}
 */
export const unbuildUpdateExpression = (
  { node, path, meta },
  scope,
  { result, operator, increment },
) => {
  if (node.type === "CallExpression") {
    return makeSequenceExpression(
      unbuildEffect({ node, path, meta }, scope, null),
      makeThrowErrorExpression(
        "ReferenceError",
        "Invalid left-hand side in assignment",
        path,
      ),
      path,
    );
  } else if (node.type === "Identifier") {
    switch (result) {
      case "new": {
        return bindSequence(
          cacheConstant(
            forkMeta((meta = nextMeta(meta))),
            makeIncrementExpression(
              { path, meta: forkMeta((meta = nextMeta(meta))) },
              {
                operator,
                left: makeScopeLoadExpression(
                  { path, meta: forkMeta((meta = nextMeta(meta))) },
                  scope,
                  {
                    type: "read",
                    mode: getMode(scope),
                    variable: /** @type {estree.Variable} */ (node.name),
                  },
                ),
                right: increment,
              },
            ),
            path,
          ),
          (result) =>
            makeSequenceExpression(
              listScopeSaveEffect(
                { path, meta: forkMeta((meta = nextMeta(meta))) },
                scope,
                {
                  type: "write",
                  mode: getMode(scope),
                  variable: /** @type {estree.Variable} */ (node.name),
                  right: makeReadCacheExpression(result, path),
                },
              ),
              makeReadCacheExpression(result, path),
              path,
            ),
        );
      }
      case "old": {
        return bindSequence(
          cacheConstant(
            forkMeta((meta = nextMeta(meta))),
            makeScopeLoadExpression(
              { path, meta: forkMeta((meta = nextMeta(meta))) },
              scope,
              {
                type: "read",
                mode: getMode(scope),
                variable: /** @type {estree.Variable} */ (node.name),
              },
            ),
            path,
          ),
          (result) =>
            makeSequenceExpression(
              listScopeSaveEffect(
                { path, meta: forkMeta((meta = nextMeta(meta))) },
                scope,
                {
                  type: "write",
                  mode: getMode(scope),
                  variable: /** @type {estree.Variable} */ (node.name),
                  right: makeIncrementExpression(
                    { path, meta: forkMeta((meta = nextMeta(meta))) },
                    {
                      operator,
                      left: makeReadCacheExpression(result, path),
                      right: increment,
                    },
                  ),
                },
              ),
              makeReadCacheExpression(result, path),
              path,
            ),
        );
      }
      default: {
        throw new AranTypeError(result);
      }
    }
  } else if (node.type === "MemberExpression") {
    return bindSequence(
      bindSequence(
        unbuildObject(
          drillSite(node, path, forkMeta((meta = nextMeta(meta))), "object"),
          scope,
          null,
        ),
        (object) =>
          duplicateObject(
            { path, meta: forkMeta((meta = nextMeta(meta))) },
            object,
          ),
      ),
      ([object1, object2]) =>
        bindSequence(
          bindSequence(
            unbuildKey(
              drillSite(
                node,
                path,
                forkMeta((meta = nextMeta(meta))),
                "property",
              ),
              scope,
              { computed: node.computed },
            ),
            (key) =>
              duplicateKey(
                { path, meta: forkMeta((meta = nextMeta(meta))) },
                key,
              ),
          ),
          ([key1, key2]) => {
            switch (result) {
              case "new": {
                return bindSequence(
                  cacheConstant(
                    forkMeta((meta = nextMeta(meta))),
                    makeIncrementExpression(
                      { path, meta: forkMeta((meta = nextMeta(meta))) },
                      {
                        operator,
                        left: makeGetMemberExpression(
                          { path, meta: forkMeta((meta = nextMeta(meta))) },
                          scope,
                          { object: object1, key: key1 },
                        ),
                        right: increment,
                      },
                    ),
                    path,
                  ),
                  (result) =>
                    makeSequenceExpression(
                      listSetMemberEffect(
                        { path, meta: forkMeta((meta = nextMeta(meta))) },
                        scope,
                        {
                          object: object2,
                          key: key2,
                          value: makeReadCacheExpression(result, path),
                        },
                      ),
                      makeReadCacheExpression(result, path),
                      path,
                    ),
                );
              }
              case "old": {
                return bindSequence(
                  cacheConstant(
                    forkMeta((meta = nextMeta(meta))),
                    makeGetMemberExpression(
                      { path, meta: forkMeta((meta = nextMeta(meta))) },
                      scope,
                      { object: object1, key: key1 },
                    ),
                    path,
                  ),
                  (result) =>
                    makeSequenceExpression(
                      listSetMemberEffect(
                        { path, meta: forkMeta((meta = nextMeta(meta))) },
                        scope,
                        {
                          object: object2,
                          key: key2,
                          value: makeIncrementExpression(
                            { path, meta: forkMeta((meta = nextMeta(meta))) },
                            {
                              operator,
                              left: makeReadCacheExpression(result, path),
                              right: increment,
                            },
                          ),
                        },
                      ),
                      makeReadCacheExpression(result, path),
                      path,
                    ),
                );
              }
              default: {
                throw new AranTypeError(result);
              }
            }
          },
        ),
    );
  } else {
    return makeEarlyErrorExpression(
      `Illegal left-hand side in update operation: ${node.type}`,
      path,
    );
  }
};

/**
 * @type {(
 *   site: import("../site").Site<estree.Pattern | estree.Expression>,
 *   scope: import("../scope").Scope,
 *   options: {
 *     operator: estree.BinaryOperator | estree.LogicalOperator,
 *     increment: import("../sequence").ExpressionSequence | null,
 *   },
 * ) => import("../sequence").EffectSequence}
 */
export const unbuildUpdateEffect = (
  { node, path, meta },
  scope,
  { operator, increment },
) => {
  if (node.type === "CallExpression") {
    return concatEffect([
      unbuildEffect({ node, path, meta }, scope, null),
      makeExpressionEffect(
        makeThrowErrorExpression(
          "ReferenceError",
          "Invalid left-hand side in assignment",
          path,
        ),
        path,
      ),
    ]);
  } else if (node.type === "Identifier") {
    return listScopeSaveEffect(
      { path, meta: forkMeta((meta = nextMeta(meta))) },
      scope,
      {
        type: "write",
        mode: getMode(scope),
        variable: /** @type {estree.Variable} */ (node.name),
        right: makeIncrementExpression(
          { path, meta: forkMeta((meta = nextMeta(meta))) },
          {
            operator,
            left: makeScopeLoadExpression(
              { path, meta: forkMeta((meta = nextMeta(meta))) },
              scope,
              {
                type: "read",
                mode: getMode(scope),
                variable: /** @type {estree.Variable} */ (node.name),
              },
            ),
            right: increment,
          },
        ),
      },
    );
  } else if (node.type === "MemberExpression") {
    return bindSequence(
      bindSequence(
        unbuildObject(
          drillSite(node, path, forkMeta((meta = nextMeta(meta))), "object"),
          scope,
          null,
        ),
        (object) =>
          duplicateObject(
            { path, meta: forkMeta((meta = nextMeta(meta))) },
            object,
          ),
      ),
      ([object1, object2]) =>
        bindSequence(
          bindSequence(
            unbuildKey(
              drillSite(
                node,
                path,
                forkMeta((meta = nextMeta(meta))),
                "property",
              ),
              scope,
              { computed: node.computed },
            ),
            (key) =>
              duplicateKey(
                { path, meta: forkMeta((meta = nextMeta(meta))) },
                key,
              ),
          ),
          ([key1, key2]) =>
            listSetMemberEffect(
              { path, meta: forkMeta((meta = nextMeta(meta))) },
              scope,
              {
                object: object2,
                key: key2,
                value: makeIncrementExpression(
                  { path, meta: forkMeta((meta = nextMeta(meta))) },
                  {
                    operator,
                    left: makeGetMemberExpression(
                      { path, meta: forkMeta((meta = nextMeta(meta))) },
                      scope,
                      { object: object1, key: key1 },
                    ),
                    right: increment,
                  },
                ),
              },
            ),
        ),
    );
  } else {
    return makeExpressionEffect(
      makeEarlyErrorExpression(
        `Illegal left-hand side in update operation: ${node.type}`,
        path,
      ),
      path,
    );
  }
};
