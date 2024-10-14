import {
  makeApplyExpression,
  makeConditionalExpression,
  makeExpressionEffect,
  makeIntrinsicExpression,
  makePrimitiveExpression,
  makeSequenceExpression,
  makeTreeConditionalEffect,
} from "../node.mjs";
import {
  makeBinaryExpression,
  makeThrowErrorExpression,
  makeUnaryExpression,
} from "../intrinsic.mjs";
import { unbuildEffect } from "./effect.mjs";
import { incorporateEffect, incorporateExpression } from "../prelude/index.mjs";
import { unbuildObject } from "./object.mjs";
import { listSetMemberEffect, makeGetMemberExpression } from "../member.mjs";
import { AranTypeError } from "../../error.mjs";
import { forkMeta, nextMeta } from "../meta.mjs";
import { unbuildKey } from "./key.mjs";
import { cacheConstant, makeReadCacheExpression } from "../cache.mjs";
import {
  EMPTY,
  concat__,
  flatenTree,
  hasNarrowKey,
  bindSequence,
  callSequence_X_,
  callSequence___X_,
  callSequence____X,
  liftSequenceX,
  liftSequenceX_,
  liftSequenceX__,
  liftSequence__XX__,
  liftSequence___X__,
  mapSequence,
  zeroSequence,
} from "../../util/index.mjs";
import { BINARY_OPERATOR_RECORD, LOGICAL_OPERATOR_RECORD } from "estree-sentry";
import {
  duplicateAssignee,
  makeMemberAssignee,
  makeVariableAssignee,
} from "../assignee.mjs";
import {
  listWriteVariableEffect,
  makeReadVariableExpression,
} from "../scope/index.mjs";

/**
 * @type {Record<
 *   Exclude<
 *     (
 *       | import("estree-sentry").UpdateOperator
 *       | import("estree-sentry").AssignmentOperator
 *     ),
 *     "="
 *   >,
 *   (
 *     | import("estree-sentry").LogicalOperator
 *     | import("estree-sentry").BinaryOperator
 *   )
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
 *   hash: import("../../hash").Hash,
 *   meta: import("../meta").Meta,
 *   scope: import("../scope").Scope,
 *   assignee: import("../assignee").Assignee,
 * ) => import("../../util/sequence").Sequence<
 *   import("../prelude").BodyPrelude,
 *   import("../atom").Expression,
 * >}
 */
const makeUpdateLoadExpression = (hash, meta, scope, assignee) => {
  switch (assignee.type) {
    case "variable": {
      return makeReadVariableExpression(hash, meta, scope, {
        variable: assignee.variable,
      });
    }
    case "member": {
      return makeGetMemberExpression(hash, meta, scope, {
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
 *   hash: import("../../hash").Hash,
 *   meta: import("../meta").Meta,
 *   scope: import("../scope").Scope,
 *   assignee: import("../assignee").Assignee,
 *   value: import("../atom").Expression,
 * ) => import("../../util/sequence").Sequence<
 *   import("../prelude").BodyPrelude,
 *   import("../../util/tree").Tree<import("../atom").Effect>,
 * >}
 */
const makeUpdateSaveEffect = (hash, meta, scope, assignee, value) => {
  switch (assignee.type) {
    case "variable": {
      return listWriteVariableEffect(hash, meta, scope, {
        variable: assignee.variable,
        right: value,
      });
    }
    case "member": {
      return listSetMemberEffect(hash, meta, scope, {
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
 *   hash: import("../../hash").Hash,
 *   meta: import("../meta").Meta,
 *   operator: import("estree-sentry").BinaryOperator,
 *   left: import("../atom").Expression,
 *   right: null | import("../atom").Expression,
 * ) => import("../../util/sequence").Sequence<
 *   import("../prelude").MetaDeclarationPrelude,
 *   import("../atom").Expression,
 * >}
 */
const makeIncrementExpression = (hash, meta, operator, left, right) => {
  if (right === null) {
    return incorporateExpression(
      mapSequence(cacheConstant(meta, left, hash), (left) =>
        makeConditionalExpression(
          makeBinaryExpression(
            "===",
            makeUnaryExpression(
              "typeof",
              makeReadCacheExpression(left, hash),
              hash,
            ),
            makePrimitiveExpression("bigint", hash),
            hash,
          ),
          makeBinaryExpression(
            operator,
            makeReadCacheExpression(left, hash),
            makePrimitiveExpression({ bigint: "1" }, hash),
            hash,
          ),
          makeBinaryExpression(
            operator,
            makeApplyExpression(
              makeIntrinsicExpression("Number", hash),
              makeIntrinsicExpression("undefined", hash),
              [makeReadCacheExpression(left, hash)],
              hash,
            ),
            makePrimitiveExpression(1, hash),
            hash,
          ),
          hash,
        ),
      ),
      hash,
    );
  } else {
    return zeroSequence(makeBinaryExpression(operator, left, right, hash));
  }
};

/**
 * @type {<X>(
 *   makeConditional: (
 *     test: import("../atom").Expression,
 *     perform: X,
 *     bypass: X,
 *     hash: import("../../hash").Hash,
 *   ) => X,
 *   operator: import("estree-sentry").LogicalOperator,
 *   test: import("../atom").Expression,
 *   perform: X,
 *   bypass: X,
 *   hash: import("../../hash").Hash,
 * ) => X}
 */
const conditional = (
  makeConditional,
  operator,
  test,
  perform,
  bypass,
  hash,
) => {
  switch (operator) {
    case "||": {
      return makeConditional(test, bypass, perform, hash);
    }
    case "&&": {
      return makeConditional(test, perform, bypass, hash);
    }
    case "??": {
      return makeConditional(
        makeBinaryExpression(
          "==",
          test,
          makePrimitiveExpression(null, hash),
          hash,
        ),
        perform,
        bypass,
        hash,
      );
    }
    default: {
      throw new AranTypeError(operator);
    }
  }
};

/**
 * @type {(
 *   hash: import("../../hash").Hash,
 *   meta: import("../meta").Meta,
 *   scope: import("../scope").Scope,
 *   assignee: import("../assignee").Assignee,
 *   assigner: import("../assigner").EffectAssigner,
 * ) => import("../../util/sequence").Sequence<
 *   import("../prelude").BodyPrelude,
 *   import("../../util/tree").Tree<import("../atom").Effect>,
 * >}
 */
const makeUpdateEffect = (
  hash,
  meta,
  scope,
  assignee,
  { operator, increment },
) =>
  incorporateEffect(
    bindSequence(
      duplicateAssignee(hash, forkMeta((meta = nextMeta(meta))), assignee),
      ([assignee1, assignee2]) => {
        if (hasNarrowKey(LOGICAL_OPERATOR_RECORD, operator)) {
          return liftSequence__XX__(
            conditional,
            makeTreeConditionalEffect,
            operator,
            makeUpdateLoadExpression(
              hash,
              forkMeta((meta = nextMeta(meta))),
              scope,
              assignee1,
            ),
            makeUpdateSaveEffect(
              hash,
              forkMeta((meta = nextMeta(meta))),
              scope,
              assignee2,
              increment ?? makeIntrinsicExpression("undefined", hash),
            ),
            EMPTY,
            hash,
          );
        } else if (hasNarrowKey(BINARY_OPERATOR_RECORD, operator)) {
          return callSequence____X(
            makeUpdateSaveEffect,
            hash,
            forkMeta((meta = nextMeta(meta))),
            scope,
            assignee1,
            callSequence___X_(
              makeIncrementExpression,
              hash,
              forkMeta((meta = nextMeta(meta))),
              operator,
              makeUpdateLoadExpression(
                hash,
                forkMeta((meta = nextMeta(meta))),
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
    hash,
  );

/**
 * @type {(
 *   hash: import("../../hash").Hash,
 *   meta: import("../meta").Meta,
 *   scope: import("../scope").Scope,
 *   assignee: import("../assignee").Assignee,
 *   assigner: import("../assigner").ExpressionAssigner,
 * ) => import("../../util/sequence").Sequence<
 *   import("../prelude").BodyPrelude,
 *   import("../atom").Expression,
 * >}
 */
export const makeUpdateExpression = (
  hash,
  meta,
  scope,
  assignee,
  { result, operator, increment },
) =>
  incorporateExpression(
    bindSequence(
      duplicateAssignee(hash, forkMeta((meta = nextMeta(meta))), assignee),
      ([assignee1, assignee2]) => {
        if (hasNarrowKey(LOGICAL_OPERATOR_RECORD, operator)) {
          return bindSequence(
            callSequence_X_(
              cacheConstant,
              forkMeta((meta = nextMeta(meta))),
              makeUpdateLoadExpression(
                hash,
                forkMeta((meta = nextMeta(meta))),
                scope,
                assignee1,
              ),
              hash,
            ),
            (old_value) =>
              liftSequence___X__(
                conditional,
                makeConditionalExpression,
                operator,
                makeReadCacheExpression(old_value, hash),
                incorporateExpression(
                  bindSequence(
                    cacheConstant(
                      forkMeta((meta = nextMeta(meta))),
                      increment ?? makeIntrinsicExpression("undefined", hash),
                      hash,
                    ),
                    (new_value) =>
                      liftSequenceX__(
                        makeSequenceExpression,
                        liftSequenceX(
                          flatenTree,
                          makeUpdateSaveEffect(
                            hash,
                            forkMeta((meta = nextMeta(meta))),
                            scope,
                            assignee2,
                            makeReadCacheExpression(new_value, hash),
                          ),
                        ),
                        makeReadCacheExpression(new_value, hash),
                        hash,
                      ),
                  ),
                  hash,
                ),
                makeReadCacheExpression(old_value, hash),
                hash,
              ),
          );
        } else if (hasNarrowKey(BINARY_OPERATOR_RECORD, operator)) {
          switch (result) {
            case "new": {
              return bindSequence(
                callSequence_X_(
                  cacheConstant,
                  forkMeta((meta = nextMeta(meta))),
                  callSequence___X_(
                    makeIncrementExpression,
                    hash,
                    forkMeta((meta = nextMeta(meta))),
                    operator,
                    makeUpdateLoadExpression(
                      hash,
                      forkMeta((meta = nextMeta(meta))),
                      scope,
                      assignee1,
                    ),
                    increment,
                  ),
                  hash,
                ),
                (result) =>
                  liftSequenceX__(
                    makeSequenceExpression,
                    liftSequenceX(
                      flatenTree,
                      makeUpdateSaveEffect(
                        hash,
                        forkMeta((meta = nextMeta(meta))),
                        scope,
                        assignee2,
                        makeReadCacheExpression(result, hash),
                      ),
                    ),
                    makeReadCacheExpression(result, hash),
                    hash,
                  ),
              );
            }
            case "old": {
              return bindSequence(
                callSequence_X_(
                  cacheConstant,
                  forkMeta((meta = nextMeta(meta))),
                  makeUpdateLoadExpression(
                    hash,
                    forkMeta((meta = nextMeta(meta))),
                    scope,
                    assignee1,
                  ),
                  hash,
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
                            makeReadCacheExpression(result, hash),
                            hash,
                          ),
                          makePrimitiveExpression("bigint", hash),
                          hash,
                        ),
                        makeReadCacheExpression(result, hash),
                        makeApplyExpression(
                          makeIntrinsicExpression("Number", hash),
                          makeIntrinsicExpression("undefined", hash),
                          [makeReadCacheExpression(result, hash)],
                          hash,
                        ),
                        hash,
                      ),
                      hash,
                    ),
                    (result) =>
                      liftSequenceX__(
                        makeSequenceExpression,
                        liftSequenceX(
                          flatenTree,
                          callSequence____X(
                            makeUpdateSaveEffect,
                            hash,
                            forkMeta((meta = nextMeta(meta))),
                            scope,
                            assignee2,
                            makeIncrementExpression(
                              hash,
                              forkMeta((meta = nextMeta(meta))),
                              operator,
                              makeReadCacheExpression(result, hash),
                              increment,
                            ),
                          ),
                        ),
                        makeReadCacheExpression(result, hash),
                        hash,
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
    hash,
  );

/**
 * @type {(
 *   node: (
 *     | import("estree-sentry").MemberExpression<import("../../hash").HashProp>
 *     | import("estree-sentry").VariableIdentifier<import("../../hash").HashProp>
 *     | import("estree-sentry").CallExpression<import("../../hash").HashProp>
 *   ),
 *   meta: import("../meta").Meta,
 *   scope: import("../scope").Scope,
 *   assigner: import("../assigner").ExpressionAssigner,
 * ) => import("../../util/sequence").Sequence<
 *   import("../prelude").BodyPrelude,
 *   import("../atom").Expression,
 * >}
 */
export const unbuildUpdateExpression = (node, meta, scope, assigner) => {
  const { _hash: hash } = node;
  if (node.type === "CallExpression") {
    return liftSequenceX__(
      makeSequenceExpression,
      liftSequenceX(flatenTree, unbuildEffect(node, meta, scope)),
      makeThrowErrorExpression(
        "ReferenceError",
        "Invalid left-hand side in assignment",
        hash,
      ),
      hash,
    );
  } else if (node.type === "Identifier") {
    return makeUpdateExpression(
      hash,
      meta,
      scope,
      makeVariableAssignee(node.name),
      assigner,
    );
  } else if (node.type === "MemberExpression") {
    return bindSequence(
      unbuildObject(node.object, forkMeta((meta = nextMeta(meta))), scope),
      (object) =>
        bindSequence(
          unbuildKey(
            node.property,
            forkMeta((meta = nextMeta(meta))),
            scope,
            node.computed,
          ),
          (key) =>
            makeUpdateExpression(
              hash,
              forkMeta((meta = nextMeta(meta))),
              scope,
              makeMemberAssignee(object, key),
              assigner,
            ),
        ),
    );
  } else {
    throw new AranTypeError(node);
  }
};

/**
 * @type {(
 *   node: (
 *     | import("estree-sentry").VariableIdentifier<import("../../hash").HashProp>
 *     | import("estree-sentry").MemberExpression<import("../../hash").HashProp>
 *     | import("estree-sentry").CallExpression<import("../../hash").HashProp>
 *   ),
 *   meta: import("../meta").Meta,
 *   scope: import("../scope").Scope,
 *   assigner: import("../assigner").EffectAssigner,
 * ) => import("../../util/sequence").Sequence<
 *   import("../prelude").BodyPrelude,
 *   import("../../util/tree").Tree<import("../atom").Effect>,
 * >}
 */
export const unbuildUpdateEffect = (node, meta, scope, assigner) => {
  const { _hash: hash } = node;
  if (node.type === "CallExpression") {
    return liftSequenceX_(
      concat__,
      unbuildEffect(node, meta, scope),
      makeExpressionEffect(
        makeThrowErrorExpression(
          "ReferenceError",
          "Invalid left-hand side in assignment",
          hash,
        ),
        hash,
      ),
    );
  } else if (node.type === "Identifier") {
    return makeUpdateEffect(
      hash,
      meta,
      scope,
      makeVariableAssignee(node.name),
      assigner,
    );
  } else if (node.type === "MemberExpression") {
    return bindSequence(
      unbuildObject(node.object, forkMeta((meta = nextMeta(meta))), scope),
      (object) =>
        bindSequence(
          unbuildKey(
            node.property,
            forkMeta((meta = nextMeta(meta))),
            scope,
            node.computed,
          ),
          (key) =>
            makeUpdateEffect(
              hash,
              forkMeta((meta = nextMeta(meta))),
              scope,
              { type: "member", object, key },
              assigner,
            ),
        ),
    );
  } else {
    throw new AranTypeError(node);
  }
};
