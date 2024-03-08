import {
  EMPTY_EFFECT,
  concatEffect,
  makeApplyExpression,
  makeConditionalEffect,
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
import { bindSequence, zeroSequence } from "../sequence.mjs";
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
import { hasNarrowKey } from "../../util/index.mjs";
import {
  BINARY_OPERATOR_RECORD,
  LOGICAL_OPERATOR_RECORD,
} from "../../estree.mjs";
import { unprefixEffect, unprefixExpression } from "../prefix.mjs";

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
 *   update: import("./update").Update,
 * ) => import("../sequence").Sequence<
 *   (
 *     | import("../prelude").NodePrelude
 *     | import("../prelude").RegularPrefixPrelude
 *   ),
 *   [
 *     import("./update").Update,
 *     import("./update").Update,
 *   ],
 * >}
 */
const duplicateUpdate = ({ path, meta }, update) => {
  switch (update.type) {
    case "variable": {
      return zeroSequence([update, update]);
    }
    case "member": {
      return bindSequence(
        duplicateObject(
          { path, meta: forkMeta((meta = nextMeta(meta))) },
          update.object,
        ),
        ([object1, object2]) =>
          bindSequence(
            duplicateKey(
              { path, meta: forkMeta((meta = nextMeta(meta))) },
              update.key,
            ),
            ([key1, key2]) =>
              zeroSequence([
                { type: "member", object: object1, key: key1 },
                { type: "member", object: object2, key: key2 },
              ]),
          ),
      );
    }
    default: {
      throw new AranTypeError(update);
    }
  }
};

/**
 * @type {(
 *   site: import("../site").LeafSite,
 *   scope: import("../scope").Scope,
 *   options: {
 *     update: import("./update").Update,
 *   },
 * ) => import("../sequence").ExpressionSequence}
 */
const makeUpdateLoadExpression = ({ path, meta }, scope, { update }) => {
  switch (update.type) {
    case "variable": {
      return makeScopeLoadExpression({ path, meta }, scope, {
        type: "read",
        mode: getMode(scope),
        variable: update.variable,
      });
    }
    case "member": {
      return makeGetMemberExpression({ path, meta }, scope, {
        object: update.object,
        key: update.key,
      });
    }
    default: {
      throw new AranTypeError(update);
    }
  }
};

/**
 * @type {(
 *   site: import("../site").LeafSite,
 *   scope: import("../scope").Scope,
 *   options: {
 *     update: import("./update").Update,
 *     value: import("../sequence").ExpressionSequence,
 *   },
 * ) => import("../sequence").EffectSequence}
 */
const makeUpdateSaveEffect = ({ path, meta }, scope, { update, value }) => {
  switch (update.type) {
    case "variable": {
      return listScopeSaveEffect({ path, meta }, scope, {
        type: "write",
        mode: getMode(scope),
        variable: update.variable,
        right: value,
      });
    }
    case "member": {
      return listSetMemberEffect({ path, meta }, scope, {
        object: update.object,
        key: update.key,
        value,
      });
    }
    default: {
      throw new AranTypeError(update);
    }
  }
};

/**
 * @type {(
 *   site: import("../site").LeafSite,
 *   options: {
 *     operator: estree.BinaryOperator,
 *     left: import("../sequence").ExpressionSequence,
 *     right: import("../sequence").ExpressionSequence | null,
 *   },
 * ) => import("../sequence").ExpressionSequence}
 */
const makeIncrementExpression = ({ path, meta }, { operator, left, right }) => {
  if (right === null) {
    return unprefixExpression(
      bindSequence(cacheConstant(meta, left, path), (left) =>
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
      ),
      path,
    );
  } else {
    return makeBinaryExpression(operator, left, right, path);
  }
};

/**
 * @type {<X>(
 *   makeConditional: (
 *     test: import("../sequence").ExpressionSequence,
 *     perform: X,
 *     bypass: X,
 *     path: unbuild.Path,
 *   ) => X,
 *   operator: estree.LogicalOperator,
 *   test: import("../sequence").ExpressionSequence,
 *   perform: X,
 *   bypass: X,
 *   path: unbuild.Path,
 * ) => X}
 */
const conditional = (
  makeConditional,
  operator,
  test,
  perform,
  bypass,
  path,
) => {
  switch (operator) {
    case "||": {
      return makeConditional(test, bypass, perform, path);
    }
    case "&&": {
      return makeConditional(test, perform, bypass, path);
    }
    case "??": {
      return makeConditional(
        makeBinaryExpression(
          "==",
          test,
          makePrimitiveExpression(null, path),
          path,
        ),
        perform,
        bypass,
        path,
      );
    }
    default: {
      throw new AranTypeError(operator);
    }
  }
};

/**
 * @type {(
 *   site: import("../site").LeafSite,
 *   scope: import("../scope").Scope,
 *   options: {
 *     update: import("./update").Update,
 *     operator: estree.BinaryOperator | estree.LogicalOperator,
 *     increment: import("../sequence").ExpressionSequence | null,
 *   },
 * ) => import("../sequence").EffectSequence}
 */
const makeUpdateEffect = (
  { path, meta },
  scope,
  { update, operator, increment },
) =>
  unprefixEffect(
    bindSequence(
      duplicateUpdate(
        { path, meta: forkMeta((meta = nextMeta(meta))) },
        update,
      ),
      ([update1, update2]) => {
        if (hasNarrowKey(LOGICAL_OPERATOR_RECORD, operator)) {
          return conditional(
            makeConditionalEffect,
            operator,
            makeUpdateLoadExpression(
              { path, meta: forkMeta((meta = nextMeta(meta))) },
              scope,
              { update: update1 },
            ),
            makeUpdateSaveEffect(
              { path, meta: forkMeta((meta = nextMeta(meta))) },
              scope,
              {
                update: update2,
                value:
                  increment ??
                  makePrimitiveExpression({ undefined: null }, path),
              },
            ),
            EMPTY_EFFECT,
            path,
          );
        } else if (hasNarrowKey(BINARY_OPERATOR_RECORD, operator)) {
          return makeUpdateSaveEffect(
            { path, meta: forkMeta((meta = nextMeta(meta))) },
            scope,
            {
              update: update2,
              value: makeIncrementExpression(
                { path, meta: forkMeta((meta = nextMeta(meta))) },
                {
                  operator,
                  left: makeUpdateLoadExpression(
                    { path, meta: forkMeta((meta = nextMeta(meta))) },
                    scope,
                    { update: update1 },
                  ),
                  right: increment,
                },
              ),
            },
          );
        } else {
          throw new AranTypeError(operator);
        }
      },
    ),
    path,
  );

/**
 * @type {(
 *   site: import("../site").LeafSite,
 *   scope: import("../scope").Scope,
 *   options: {
 *     result: "new" | "old",
 *     update: import("./update").Update,
 *     operator: estree.BinaryOperator | estree.LogicalOperator,
 *     increment: import("../sequence").ExpressionSequence | null,
 *   },
 * ) => import("../sequence").ExpressionSequence}
 */
export const makeUpdateExpression = (
  { path, meta },
  scope,
  { result, update, operator, increment },
) =>
  unprefixExpression(
    bindSequence(
      duplicateUpdate(
        { path, meta: forkMeta((meta = nextMeta(meta))) },
        update,
      ),
      ([update1, update2]) => {
        if (hasNarrowKey(LOGICAL_OPERATOR_RECORD, operator)) {
          return bindSequence(
            cacheConstant(
              forkMeta((meta = nextMeta(meta))),
              makeUpdateLoadExpression(
                { path, meta: forkMeta((meta = nextMeta(meta))) },
                scope,
                { update: update1 },
              ),
              path,
            ),
            (old_value) =>
              conditional(
                makeConditionalExpression,
                operator,
                makeReadCacheExpression(old_value, path),
                unprefixExpression(
                  bindSequence(
                    cacheConstant(
                      forkMeta((meta = nextMeta(meta))),
                      increment ??
                        makePrimitiveExpression({ undefined: null }, path),
                      path,
                    ),
                    (new_value) =>
                      makeSequenceExpression(
                        makeUpdateSaveEffect(
                          { path, meta: forkMeta((meta = nextMeta(meta))) },
                          scope,
                          {
                            update: update2,
                            value: makeReadCacheExpression(new_value, path),
                          },
                        ),
                        makeReadCacheExpression(new_value, path),
                        path,
                      ),
                  ),
                  path,
                ),
                makeReadCacheExpression(old_value, path),
                path,
              ),
          );
        } else if (hasNarrowKey(BINARY_OPERATOR_RECORD, operator)) {
          switch (result) {
            case "new": {
              return bindSequence(
                cacheConstant(
                  forkMeta((meta = nextMeta(meta))),
                  makeIncrementExpression(
                    { path, meta: forkMeta((meta = nextMeta(meta))) },
                    {
                      operator,
                      left: makeUpdateLoadExpression(
                        { path, meta: forkMeta((meta = nextMeta(meta))) },
                        scope,
                        { update: update1 },
                      ),
                      right: increment,
                    },
                  ),
                  path,
                ),
                (result) =>
                  makeSequenceExpression(
                    makeUpdateSaveEffect(
                      { path, meta: forkMeta((meta = nextMeta(meta))) },
                      scope,
                      {
                        update: update2,
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
                  makeUpdateLoadExpression(
                    { path, meta: forkMeta((meta = nextMeta(meta))) },
                    scope,
                    { update: update1 },
                  ),
                  path,
                ),
                (result) =>
                  bindSequence(
                    cacheConstant(
                      forkMeta((meta = nextMeta(meta))),
                      makeConditionalExpression(
                        makeBinaryExpression(
                          "===",
                          makeUnaryExpression(
                            "typeof",
                            makeReadCacheExpression(result, path),
                            path,
                          ),
                          makePrimitiveExpression("bigint", path),
                          path,
                        ),
                        makeReadCacheExpression(result, path),
                        makeApplyExpression(
                          makeIntrinsicExpression("Number", path),
                          makePrimitiveExpression({ undefined: null }, path),
                          [makeReadCacheExpression(result, path)],
                          path,
                        ),
                        path,
                      ),
                      path,
                    ),
                    (result) =>
                      makeSequenceExpression(
                        makeUpdateSaveEffect(
                          { path, meta: forkMeta((meta = nextMeta(meta))) },
                          scope,
                          {
                            update: update2,
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
                  ),
              );
            }
            default: {
              throw new AranTypeError(result);
            }
          }
        } else {
          throw new AranTypeError(operator);
        }
      },
    ),
    path,
  );

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
    return makeUpdateExpression({ path, meta }, scope, {
      result,
      update: {
        type: "variable",
        variable: /** @type {estree.Variable} */ (node.name),
      },
      operator,
      increment,
    });
  } else if (node.type === "MemberExpression") {
    return unprefixExpression(
      bindSequence(
        unbuildObject(
          drillSite(node, path, forkMeta((meta = nextMeta(meta))), "object"),
          scope,
          null,
        ),
        (object) =>
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
              makeUpdateExpression(
                { path, meta: forkMeta((meta = nextMeta(meta))) },
                scope,
                {
                  result,
                  update: { type: "member", object, key },
                  operator,
                  increment,
                },
              ),
          ),
      ),
      path,
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
    return makeUpdateEffect({ path, meta }, scope, {
      update: {
        type: "variable",
        variable: /** @type {estree.Variable} */ (node.name),
      },
      operator,
      increment,
    });
  } else if (node.type === "MemberExpression") {
    return unprefixEffect(
      bindSequence(
        unbuildObject(
          drillSite(node, path, forkMeta((meta = nextMeta(meta))), "object"),
          scope,
          null,
        ),
        (object) =>
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
              makeUpdateEffect(
                { path, meta: forkMeta((meta = nextMeta(meta))) },
                scope,
                {
                  update: { type: "member", object, key },
                  operator,
                  increment,
                },
              ),
          ),
      ),
      path,
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
