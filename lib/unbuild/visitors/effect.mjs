import {
  EMPTY,
  concatX_,
  concat_,
  flat,
  hasNarrowKey,
  mapIndex,
} from "../../util/index.mjs";
import { AranTypeError } from "../../report.mjs";
import {
  makeExpressionEffect,
  makePrimitiveExpression,
  makeConditionalEffect,
} from "../node.mjs";
import {
  makeBinaryExpression,
  makeThrowErrorExpression,
} from "../intrinsic.mjs";
import { unbuildExpression, unbuildNameExpression } from "./expression.mjs";
import { makePatternContext, unbuildPattern } from "./pattern.mjs";
import { UPDATE_OPERATOR_RECORD, unbuildUpdateEffect } from "./update.mjs";
import { drillDeepSite, drillSite } from "../site.mjs";
import {
  bindSequence,
  callSequence__X,
  flatSequence,
  liftSequenceX,
  liftSequenceXXX_,
  liftSequenceXX__,
  liftSequenceX_,
  liftSequenceX_X_,
  liftSequence_X,
  liftSequence_X__,
  liftSequence__X,
} from "../../sequence.mjs";
import { forkMeta, nextMeta } from "../meta.mjs";
import { listSetMemberEffect } from "../member.mjs";
import { unbuildObject } from "./object.mjs";
import { unbuildKey } from "./key.mjs";
import { LOGICAL_ASSIGNMENT_OPERATOR_RECORD } from "../../estree.mjs";
import { makeEffectAssigner } from "../assigner.mjs";

/**
 * @type {(
 *   node: import("../../estree").AssignmentExpression,
 * ) => node is import("../../estree").AssignmentExpression & {
 *   left: import("@babel/types").MemberExpression,
 * }}
 */
const isMemberAssignment = (node) =>
  node.left.type === "MemberExpression" && node.operator === "=";

/**
 * @type {(
 *   site: import("../site").Site<import("../../estree").Expression>,
 *   scope: import("../scope").Scope,
 *   options: null,
 * ) => import("../../sequence").Sequence<
 *   import("../prelude").BodyPrelude,
 *   import("../atom").Effect[],
 * >}
 */
export const unbuildEffect = ({ node, path, meta }, scope, _options) => {
  switch (node.type) {
    case "AssignmentExpression": {
      /** @type {import("../name").Name} */
      const name =
        node.left.type === "Identifier"
          ? {
              type: "assignment",
              variable: /** @type {import("../../estree").Variable} */ (
                node.left.name
              ),
            }
          : { type: "anonymous" };
      if (node.operator === "=") {
        // TODO this looks like redundant logic that could be removed
        // > (console.log('foo') = 123);
        // foo
        // Uncaught ReferenceError: Invalid left-hand side in assignment
        if (
          /** @type {import("../../estree").Expression} */ (node.left).type ===
          "CallExpression"
        ) {
          return liftSequenceX_(
            concatX_,
            unbuildEffect(
              /** @type {import("../site").Site<import("../../estree").Expression>} */ (
                drillSite(node, path, forkMeta((meta = nextMeta(meta))), "left")
              ),
              scope,
              null,
            ),
            makeExpressionEffect(
              makeThrowErrorExpression(
                "ReferenceError",
                "Invalid left-hand side in assignment",
                path,
              ),
              path,
            ),
          );
        } else if (isMemberAssignment(node)) {
          // eval order: node.left.object >> node.left.property >> node.right
          return bindSequence(
            unbuildObject(
              drillDeepSite(
                node,
                path,
                forkMeta((meta = nextMeta(meta))),
                "left",
                "object",
              ),
              scope,
              null,
            ),
            (object) =>
              bindSequence(
                unbuildKey(
                  drillDeepSite(
                    node,
                    path,
                    forkMeta((meta = nextMeta(meta))),
                    "left",
                    "property",
                  ),
                  scope,
                  { computed: node.left.computed },
                ),
                (key) =>
                  bindSequence(
                    unbuildExpression(
                      drillSite(
                        node,
                        path,
                        forkMeta((meta = nextMeta(meta))),
                        "right",
                      ),
                      scope,
                      null,
                    ),
                    (value) =>
                      listSetMemberEffect(
                        { path, meta: forkMeta((meta = nextMeta(meta))) },
                        scope,
                        { object, key, value },
                      ),
                  ),
              ),
          );
        } else {
          return callSequence__X(
            unbuildPattern,
            drillSite(node, path, forkMeta((meta = nextMeta(meta))), "left"),
            scope,
            liftSequence_X(
              makePatternContext,
              null,
              unbuildNameExpression(
                drillSite(
                  node,
                  path,
                  forkMeta((meta = nextMeta(meta))),
                  "right",
                ),
                scope,
                { name },
              ),
            ),
          );
        }
      } else {
        return callSequence__X(
          unbuildUpdateEffect,
          drillSite(node, path, forkMeta((meta = nextMeta(meta))), "left"),
          scope,
          liftSequence__X(
            makeEffectAssigner,
            "discard",
            UPDATE_OPERATOR_RECORD[node.operator],
            unbuildNameExpression(
              drillSite(node, path, forkMeta((meta = nextMeta(meta))), "right"),
              scope,
              {
                name:
                  hasNarrowKey(
                    LOGICAL_ASSIGNMENT_OPERATOR_RECORD,
                    node.operator,
                  ) && node.left.type === "Identifier"
                    ? {
                        type: "assignment",
                        variable:
                          /** @type {import("../../estree").Variable} */ (
                            node.left.name
                          ),
                      }
                    : { type: "anonymous" },
              },
            ),
          ),
        );
      }
    }
    case "UpdateExpression": {
      return unbuildUpdateEffect(
        drillSite(node, path, forkMeta((meta = nextMeta(meta))), "argument"),
        scope,
        makeEffectAssigner(
          "discard",
          UPDATE_OPERATOR_RECORD[node.operator],
          null,
        ),
      );
    }
    case "SequenceExpression": {
      return liftSequenceX(
        flat,
        flatSequence(
          mapIndex(node.expressions.length, (index) =>
            unbuildEffect(
              drillDeepSite(
                node,
                path,
                forkMeta((meta = nextMeta(meta))),
                "expressions",
                index,
              ),
              scope,
              null,
            ),
          ),
        ),
      );
    }
    case "ConditionalExpression": {
      return liftSequenceX(
        concat_,
        liftSequenceXXX_(
          makeConditionalEffect,
          unbuildExpression(
            drillSite(node, path, forkMeta((meta = nextMeta(meta))), "test"),
            scope,
            null,
          ),
          unbuildEffect(
            drillSite(
              node,
              path,
              forkMeta((meta = nextMeta(meta))),
              "consequent",
            ),
            scope,
            null,
          ),
          unbuildEffect(
            drillSite(
              node,
              path,
              forkMeta((meta = nextMeta(meta))),
              "alternate",
            ),
            scope,
            null,
          ),
          path,
        ),
      );
    }
    case "LogicalExpression": {
      switch (node.operator) {
        case "&&": {
          return liftSequenceX(
            concat_,
            liftSequenceXX__(
              makeConditionalEffect,
              unbuildExpression(
                drillSite(
                  node,
                  path,
                  forkMeta((meta = nextMeta(meta))),
                  "left",
                ),
                scope,
                null,
              ),
              unbuildEffect(
                drillSite(
                  node,
                  path,
                  forkMeta((meta = nextMeta(meta))),
                  "right",
                ),
                scope,
                null,
              ),
              EMPTY,
              path,
            ),
          );
        }
        case "||": {
          return liftSequenceX(
            concat_,
            liftSequenceX_X_(
              makeConditionalEffect,
              unbuildExpression(
                drillSite(
                  node,
                  path,
                  forkMeta((meta = nextMeta(meta))),
                  "left",
                ),
                scope,
                null,
              ),
              EMPTY,
              unbuildEffect(
                drillSite(
                  node,
                  path,
                  forkMeta((meta = nextMeta(meta))),
                  "right",
                ),
                scope,
                null,
              ),
              path,
            ),
          );
        }
        case "??": {
          return liftSequenceX(
            concat_,
            liftSequenceXX__(
              makeConditionalEffect,
              liftSequence_X__(
                makeBinaryExpression,
                "==",
                unbuildExpression(
                  drillSite(
                    node,
                    path,
                    forkMeta((meta = nextMeta(meta))),
                    "left",
                  ),
                  scope,
                  null,
                ),
                makePrimitiveExpression(null, path),
                path,
              ),
              unbuildEffect(
                drillSite(
                  node,
                  path,
                  forkMeta((meta = nextMeta(meta))),
                  "right",
                ),
                scope,
                null,
              ),
              EMPTY,
              path,
            ),
          );
        }
        default: {
          throw new AranTypeError(node);
        }
      }
    }
    default: {
      return liftSequenceX(
        concat_,
        liftSequenceX_(
          makeExpressionEffect,
          unbuildExpression({ node, path, meta }, scope, null),
          path,
        ),
      );
    }
  }
};
