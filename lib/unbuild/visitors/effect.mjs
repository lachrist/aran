import {
  EMPTY,
  concatX_,
  concat_,
  flat,
  hasNarrowKey,
  map,
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
import {
  bindSequence,
  callSequence__X,
  flatSequence,
  liftSequenceX,
  liftSequenceXXX_,
  liftSequenceXX__,
  liftSequenceX_,
  liftSequenceX_X_,
  liftSequence_X__,
  liftSequence__X,
  mapSequence,
} from "../../sequence.mjs";
import { forkMeta, nextMeta } from "../meta.mjs";
import { listSetMemberEffect } from "../member.mjs";
import { unbuildObject } from "./object.mjs";
import { unbuildKey } from "./key.mjs";
import { LOGICAL_ASSIGNMENT_OPERATOR_RECORD } from "../../estree.mjs";
import { makeEffectAssigner } from "../assigner.mjs";

/**
 * @type {(
 *   node: import("../../estree").Expression,
 *   meta: import("../meta").Meta,
 *   context: import("../context").Context,
 * ) => import("../../sequence").Sequence<
 *   import("../prelude").BodyPrelude,
 *   import("../atom").Effect[],
 * >}
 */
export const unbuildEffect = (node, meta, { digest, scope, annotation }) => {
  const hash = digest(node);
  switch (node.type) {
    case "AssignmentExpression": {
      /** @type {import("../name").Name} */
      const name =
        !hasNarrowKey(LOGICAL_ASSIGNMENT_OPERATOR_RECORD, node.operator) &&
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
        if (node.left.type === "CallExpression") {
          return liftSequenceX_(
            concatX_,
            unbuildEffect(node.left, forkMeta((meta = nextMeta(meta))), {
              digest,
              scope,
              annotation,
            }),
            makeExpressionEffect(
              makeThrowErrorExpression(
                "ReferenceError",
                "Invalid left-hand side in assignment",
                hash,
              ),
              hash,
            ),
          );
        } else if (node.left.type === "MemberExpression") {
          const ts_node_left = node.left;
          // eval order: node.left.object >> node.left.property >> node.right
          return bindSequence(
            unbuildObject(
              ts_node_left.object,
              forkMeta((meta = nextMeta(meta))),
              {
                digest,
                scope,
                annotation,
              },
            ),
            (object) =>
              bindSequence(
                unbuildKey(
                  ts_node_left.property,
                  forkMeta((meta = nextMeta(meta))),
                  {
                    digest,
                    scope,
                    annotation,
                    computed: ts_node_left.computed,
                  },
                ),
                (key) =>
                  bindSequence(
                    unbuildExpression(
                      node.right,
                      forkMeta((meta = nextMeta(meta))),
                      { digest, scope, annotation },
                    ),
                    (value) =>
                      listSetMemberEffect(
                        hash,
                        forkMeta((meta = nextMeta(meta))),
                        scope,
                        { object, key, value },
                      ),
                  ),
              ),
          );
        } else {
          return callSequence__X(
            unbuildPattern,
            node.left,
            forkMeta((meta = nextMeta(meta))),
            liftSequenceX_(
              makePatternContext,
              unbuildNameExpression(
                node.right,
                forkMeta((meta = nextMeta(meta))),
                { digest, scope, annotation, name },
              ),
              { digest, scope, annotation, kind: null },
            ),
          );
        }
      } else {
        return callSequence__X(
          unbuildUpdateEffect,
          node.left,
          forkMeta((meta = nextMeta(meta))),
          mapSequence(
            liftSequence__X(
              makeEffectAssigner,
              "discard",
              UPDATE_OPERATOR_RECORD[node.operator],
              unbuildNameExpression(
                node.right,
                forkMeta((meta = nextMeta(meta))),
                { digest, scope, annotation, name },
              ),
            ),
            (assigner) => ({ digest, scope, annotation, assigner }),
          ),
        );
      }
    }
    case "UpdateExpression": {
      return unbuildUpdateEffect(node.argument, meta, {
        digest,
        scope,
        annotation,
        assigner: makeEffectAssigner(
          "discard",
          UPDATE_OPERATOR_RECORD[node.operator],
          null,
        ),
      });
    }
    case "SequenceExpression": {
      return liftSequenceX(
        flat,
        flatSequence(
          map(node.expressions, (node) =>
            unbuildEffect(node, forkMeta((meta = nextMeta(meta))), {
              digest,
              scope,
              annotation,
            }),
          ),
        ),
      );
    }
    case "ConditionalExpression": {
      return liftSequenceX(
        concat_,
        liftSequenceXXX_(
          makeConditionalEffect,
          unbuildExpression(node.test, forkMeta((meta = nextMeta(meta))), {
            digest,
            scope,
            annotation,
          }),
          unbuildEffect(node.consequent, forkMeta((meta = nextMeta(meta))), {
            digest,
            scope,
            annotation,
          }),
          unbuildEffect(node.alternate, forkMeta((meta = nextMeta(meta))), {
            digest,
            scope,
            annotation,
          }),
          hash,
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
              unbuildExpression(node.left, forkMeta((meta = nextMeta(meta))), {
                digest,
                scope,
                annotation,
              }),
              unbuildEffect(node.right, forkMeta((meta = nextMeta(meta))), {
                digest,
                scope,
                annotation,
              }),
              EMPTY,
              hash,
            ),
          );
        }
        case "||": {
          return liftSequenceX(
            concat_,
            liftSequenceX_X_(
              makeConditionalEffect,
              unbuildExpression(node.left, forkMeta((meta = nextMeta(meta))), {
                digest,
                scope,
                annotation,
              }),
              EMPTY,
              unbuildEffect(node.right, forkMeta((meta = nextMeta(meta))), {
                digest,
                scope,
                annotation,
              }),
              hash,
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
                  node.left,
                  forkMeta((meta = nextMeta(meta))),
                  { digest, scope, annotation },
                ),
                makePrimitiveExpression(null, hash),
                hash,
              ),
              unbuildEffect(node.right, forkMeta((meta = nextMeta(meta))), {
                digest,
                scope,
                annotation,
              }),
              EMPTY,
              hash,
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
          unbuildExpression(node, meta, { digest, scope, annotation }),
          hash,
        ),
      );
    }
  }
};
