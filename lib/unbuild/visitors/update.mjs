import {
  listConditionalEffect,
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
import {
  makeEarlyErrorExpression,
  makeRegularEarlyError,
} from "../early-error.mjs";
import { unbuildObject } from "./object.mjs";
import { listSetMemberEffect, makeGetMemberExpression } from "../member.mjs";
import {
  bindSequence,
  callSequence_X_,
  callSequence__X_,
  callSequence___X,
  liftSequenceX,
  liftSequenceX_,
  liftSequenceX__,
  liftSequence__XX__,
  liftSequence___X__,
  mapSequence,
  zeroSequence,
} from "../sequence.mjs";
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
import { EMPTY, concatX_, concat_, hasNarrowKey } from "../../util/index.mjs";
import {
  BINARY_OPERATOR_RECORD,
  LOGICAL_OPERATOR_RECORD,
} from "../../estree.mjs";
import { cleanupEffect, cleanupExpression } from "../cleanup.mjs";
import {
  duplicateAssignee,
  makeMemberAssignee,
  makeVariableAssignee,
} from "../assignee.mjs";

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
 *   scope: import("../scope").Scope,
 *   assignee: import("../assignee").Assignee,
 * ) => import("../sequence").Sequence<
 *   import("../prelude").BodyPrelude,
 *   aran.Expression<unbuild.Atom>,
 * >}
 */
const makeUpdateLoadExpression = ({ path, meta }, scope, assignee) => {
  switch (assignee.type) {
    case "variable": {
      return makeScopeLoadExpression({ path, meta }, scope, {
        type: "read",
        mode: getMode(scope),
        variable: assignee.variable,
      });
    }
    case "member": {
      return makeGetMemberExpression({ path, meta }, scope, {
        object: assignee.object,
        key: assignee.key,
      });
    }
    default: {
      throw new AranTypeError(assignee);
    }
  }
};

/**
 * @type {(
 *   site: import("../site").LeafSite,
 *   scope: import("../scope").Scope,
 *   assignee: import("../assignee").Assignee,
 *   value: aran.Expression<unbuild.Atom>,
 * ) => import("../sequence").Sequence<
 *   import("../prelude").BodyPrelude,
 *   aran.Effect<unbuild.Atom>[],
 * >}
 */
const makeUpdateSaveEffect = ({ path, meta }, scope, assignee, value) => {
  switch (assignee.type) {
    case "variable": {
      return listScopeSaveEffect({ path, meta }, scope, {
        type: "write",
        mode: getMode(scope),
        variable: assignee.variable,
        right: value,
      });
    }
    case "member": {
      return listSetMemberEffect({ path, meta }, scope, {
        object: assignee.object,
        key: assignee.key,
        value,
      });
    }
    default: {
      throw new AranTypeError(assignee);
    }
  }
};

/**
 * @type {(
 *   site: import("../site").LeafSite,
 *   operator: estree.BinaryOperator,
 *   left: aran.Expression<unbuild.Atom>,
 *   right: null | aran.Expression<unbuild.Atom>,
 * ) => import("../sequence").Sequence<
 *   import("../prelude").MetaDeclarationPrelude,
 *   aran.Expression<unbuild.Atom>,
 * >}
 */
const makeIncrementExpression = ({ path, meta }, operator, left, right) => {
  if (right === null) {
    return cleanupExpression(
      mapSequence(cacheConstant(meta, left, path), (left) =>
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
    return zeroSequence(makeBinaryExpression(operator, left, right, path));
  }
};

/**
 * @type {<X>(
 *   makeConditional: (
 *     test: aran.Expression<unbuild.Atom>,
 *     perform: X,
 *     bypass: X,
 *     path: unbuild.Path,
 *   ) => X,
 *   operator: estree.LogicalOperator,
 *   test: aran.Expression<unbuild.Atom>,
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
 *     assignee: import("../assignee").Assignee,
 *     assigner: import("../assigner").EffectAssigner,
 *   },
 * ) => import("../sequence").Sequence<
 *   import("../prelude").BodyPrelude,
 *   aran.Effect<unbuild.Atom>[],
 * >}
 */
const makeUpdateEffect = (
  { path, meta },
  scope,
  { assignee, assigner: { operator, increment } },
) =>
  cleanupEffect(
    bindSequence(
      duplicateAssignee(
        { path, meta: forkMeta((meta = nextMeta(meta))) },
        assignee,
      ),
      ([assignee1, assignee2]) => {
        if (hasNarrowKey(LOGICAL_OPERATOR_RECORD, operator)) {
          return liftSequence__XX__(
            conditional,
            listConditionalEffect,
            operator,
            makeUpdateLoadExpression(
              { path, meta: forkMeta((meta = nextMeta(meta))) },
              scope,
              assignee1,
            ),
            makeUpdateSaveEffect(
              { path, meta: forkMeta((meta = nextMeta(meta))) },
              scope,
              assignee2,
              increment ?? makePrimitiveExpression({ undefined: null }, path),
            ),
            EMPTY,
            path,
          );
        } else if (hasNarrowKey(BINARY_OPERATOR_RECORD, operator)) {
          return callSequence___X(
            makeUpdateSaveEffect,
            { path, meta: forkMeta((meta = nextMeta(meta))) },
            scope,
            assignee1,
            callSequence__X_(
              makeIncrementExpression,
              { path, meta: forkMeta((meta = nextMeta(meta))) },
              operator,
              makeUpdateLoadExpression(
                { path, meta: forkMeta((meta = nextMeta(meta))) },
                scope,
                assignee2,
              ),
              increment,
            ),
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
 *     assignee: import("../assignee").Assignee,
 *     assigner: import("../assigner").ExpressionAssigner,
 *   },
 * ) => import("../sequence").Sequence<
 *   import("../prelude").BodyPrelude,
 *   aran.Expression<unbuild.Atom>,
 * >}
 */
export const makeUpdateExpression = (
  { path, meta },
  scope,
  { assignee, assigner: { result, operator, increment } },
) =>
  cleanupExpression(
    bindSequence(
      duplicateAssignee(
        { path, meta: forkMeta((meta = nextMeta(meta))) },
        assignee,
      ),
      ([assignee1, assignee2]) => {
        if (hasNarrowKey(LOGICAL_OPERATOR_RECORD, operator)) {
          return bindSequence(
            callSequence_X_(
              cacheConstant,
              forkMeta((meta = nextMeta(meta))),
              makeUpdateLoadExpression(
                { path, meta: forkMeta((meta = nextMeta(meta))) },
                scope,
                assignee1,
              ),
              path,
            ),
            (old_value) =>
              liftSequence___X__(
                conditional,
                makeConditionalExpression,
                operator,
                makeReadCacheExpression(old_value, path),
                cleanupExpression(
                  bindSequence(
                    cacheConstant(
                      forkMeta((meta = nextMeta(meta))),
                      increment ??
                        makePrimitiveExpression({ undefined: null }, path),
                      path,
                    ),
                    (new_value) =>
                      liftSequenceX__(
                        makeSequenceExpression,
                        makeUpdateSaveEffect(
                          { path, meta: forkMeta((meta = nextMeta(meta))) },
                          scope,
                          assignee2,
                          makeReadCacheExpression(new_value, path),
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
                callSequence_X_(
                  cacheConstant,
                  forkMeta((meta = nextMeta(meta))),
                  callSequence__X_(
                    makeIncrementExpression,
                    { path, meta: forkMeta((meta = nextMeta(meta))) },
                    operator,
                    makeUpdateLoadExpression(
                      { path, meta: forkMeta((meta = nextMeta(meta))) },
                      scope,
                      assignee1,
                    ),
                    increment,
                  ),
                  path,
                ),
                (result) =>
                  liftSequenceX__(
                    makeSequenceExpression,
                    makeUpdateSaveEffect(
                      { path, meta: forkMeta((meta = nextMeta(meta))) },
                      scope,
                      assignee2,
                      makeReadCacheExpression(result, path),
                    ),
                    makeReadCacheExpression(result, path),
                    path,
                  ),
              );
            }
            case "old": {
              return bindSequence(
                callSequence_X_(
                  cacheConstant,
                  forkMeta((meta = nextMeta(meta))),
                  makeUpdateLoadExpression(
                    { path, meta: forkMeta((meta = nextMeta(meta))) },
                    scope,
                    assignee1,
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
                      liftSequenceX__(
                        makeSequenceExpression,
                        callSequence___X(
                          makeUpdateSaveEffect,
                          { path, meta: forkMeta((meta = nextMeta(meta))) },
                          scope,
                          assignee2,
                          makeIncrementExpression(
                            { path, meta: forkMeta((meta = nextMeta(meta))) },
                            operator,
                            makeReadCacheExpression(result, path),
                            increment,
                          ),
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
 *   options: import("../assigner").ExpressionAssigner,
 * ) => import("../sequence").Sequence<
 *   import("../prelude").BodyPrelude,
 *   aran.Expression<unbuild.Atom>,
 * >}
 */
export const unbuildUpdateExpression = (
  { node, path, meta },
  scope,
  assigner,
) => {
  if (node.type === "CallExpression") {
    return liftSequenceX__(
      makeSequenceExpression,
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
      assignee: makeVariableAssignee(
        /** @type {estree.Variable} */ (node.name),
      ),
      assigner,
    });
  } else if (node.type === "MemberExpression") {
    return cleanupExpression(
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
                  assignee: makeMemberAssignee(object, key),
                  assigner,
                },
              ),
          ),
      ),
      path,
    );
  } else {
    return makeEarlyErrorExpression(
      makeRegularEarlyError(
        `Illegal left-hand side in assignee operation: ${node.type}`,
        path,
      ),
    );
  }
};

/**
 * @type {(
 *   site: import("../site").Site<estree.Pattern | estree.Expression>,
 *   scope: import("../scope").Scope,
 *   options: import("../assigner").EffectAssigner,
 * ) => import("../sequence").Sequence<
 *   import("../prelude").BodyPrelude,
 *   aran.Effect<unbuild.Atom>[],
 * >}
 */
export const unbuildUpdateEffect = ({ node, path, meta }, scope, assigner) => {
  if (node.type === "CallExpression") {
    return liftSequenceX_(
      concatX_,
      unbuildEffect({ node, path, meta }, scope, null),
      makeExpressionEffect(
        makeThrowErrorExpression(
          "ReferenceError",
          "Invalid left-hand side in assignment",
          path,
        ),
        path,
      ),
    );
  } else if (node.type === "Identifier") {
    return makeUpdateEffect({ path, meta }, scope, {
      assignee: makeVariableAssignee(
        /** @type {estree.Variable} */ (node.name),
      ),
      assigner,
    });
  } else if (node.type === "MemberExpression") {
    return cleanupEffect(
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
                  assignee: { type: "member", object, key },
                  assigner,
                },
              ),
          ),
      ),
      path,
    );
  } else {
    return liftSequenceX(
      concat_,
      liftSequenceX_(
        makeExpressionEffect,
        makeEarlyErrorExpression(
          makeRegularEarlyError(
            `Illegal left-hand side in assignee operation: ${node.type}`,
            path,
          ),
        ),
        path,
      ),
    );
  }
};
