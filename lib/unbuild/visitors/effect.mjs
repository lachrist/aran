import {
  EMPTY,
  concat_,
  concat__,
  flatenTree,
  hasNarrowKey,
  map,
  bindSequence,
  callSequence___X,
  flatSequence,
  liftSequenceX,
  liftSequenceXXX_,
  liftSequenceXX__,
  liftSequenceX_,
  liftSequenceX_X_,
  liftSequence_X__,
  liftSequence__X,
} from "../../util/index.mjs";
import { AranTypeError } from "../../error.mjs";
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
import { unbuildWritePattern } from "./pattern.mjs";
import { UPDATE_OPERATOR_RECORD, unbuildUpdateEffect } from "./update.mjs";
import { forkMeta, nextMeta } from "../meta.mjs";
import { listSetMemberEffect } from "../member.mjs";
import { unbuildObject } from "./object.mjs";
import { unbuildKey } from "./key.mjs";
import { makeEffectAssigner } from "../assigner.mjs";
import { ANONYMOUS_NAME } from "../name.mjs";

const LOGICAL_ASSIGNMENT_OPERATOR_RECORD = {
  "||=": null,
  "&&=": null,
  "??=": null,
};

/**
 * @type {(
 *   node: import("estree-sentry").Expression<import("../../hash").HashProp>,
 *   meta: import("../meta").Meta,
 *   scope: import("../scope").Scope,
 * ) => import("../../util/sequence").Sequence<
 *   import("../prelude").BodyPrelude,
 *   import("../../util/tree").Tree<import("../atom").Effect>,
 * >}
 */
export const unbuildEffect = (node, meta, scope) => {
  const { _hash: hash } = node;
  switch (node.type) {
    case "AssignmentExpression": {
      /** @type {import("../name").Name} */
      const name =
        (node.operator === "=" ||
          hasNarrowKey(LOGICAL_ASSIGNMENT_OPERATOR_RECORD, node.operator)) &&
        node.left.type === "Identifier"
          ? {
              type: "assignment",
              variable: node.left.name,
            }
          : ANONYMOUS_NAME;
      if (node.operator === "=") {
        // TODO this looks like redundant logic that could be removed
        // > (console.log('foo') = 123);
        // foo
        // Uncaught ReferenceError: Invalid left-hand side in assignment
        if (node.left.type === "CallExpression") {
          return liftSequenceX_(
            concat__,
            unbuildEffect(node.left, forkMeta((meta = nextMeta(meta))), scope),
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
              scope,
            ),
            (object) =>
              bindSequence(
                unbuildKey(
                  ts_node_left.property,
                  forkMeta((meta = nextMeta(meta))),
                  scope,
                  ts_node_left.computed,
                ),
                (key) =>
                  bindSequence(
                    unbuildExpression(
                      node.right,
                      forkMeta((meta = nextMeta(meta))),
                      scope,
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
          return callSequence___X(
            unbuildWritePattern,
            node.left,
            forkMeta((meta = nextMeta(meta))),
            scope,
            unbuildNameExpression(
              node.right,
              forkMeta((meta = nextMeta(meta))),
              scope,
              name,
            ),
          );
        }
      } else {
        return callSequence___X(
          unbuildUpdateEffect,
          node.left,
          forkMeta((meta = nextMeta(meta))),
          scope,
          liftSequence__X(
            makeEffectAssigner,
            "discard",
            UPDATE_OPERATOR_RECORD[node.operator],
            unbuildNameExpression(
              node.right,
              forkMeta((meta = nextMeta(meta))),
              scope,
              name,
            ),
          ),
        );
      }
    }
    case "UpdateExpression": {
      return unbuildUpdateEffect(
        node.argument,
        meta,
        scope,
        makeEffectAssigner(
          "discard",
          UPDATE_OPERATOR_RECORD[node.operator],
          null,
        ),
      );
    }
    case "SequenceExpression": {
      return flatSequence(
        map(node.expressions, (node) =>
          unbuildEffect(node, forkMeta((meta = nextMeta(meta))), scope),
        ),
      );
    }
    case "ConditionalExpression": {
      return liftSequenceXXX_(
        makeConditionalEffect,
        unbuildExpression(node.test, forkMeta((meta = nextMeta(meta))), scope),
        liftSequenceX(
          flatenTree,
          unbuildEffect(
            node.consequent,
            forkMeta((meta = nextMeta(meta))),
            scope,
          ),
        ),
        liftSequenceX(
          flatenTree,
          unbuildEffect(
            node.alternate,
            forkMeta((meta = nextMeta(meta))),
            scope,
          ),
        ),
        hash,
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
                node.left,
                forkMeta((meta = nextMeta(meta))),
                scope,
              ),
              liftSequenceX(
                flatenTree,
                unbuildEffect(
                  node.right,
                  forkMeta((meta = nextMeta(meta))),
                  scope,
                ),
              ),
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
              unbuildExpression(
                node.left,
                forkMeta((meta = nextMeta(meta))),
                scope,
              ),
              EMPTY,
              liftSequenceX(
                flatenTree,
                unbuildEffect(
                  node.right,
                  forkMeta((meta = nextMeta(meta))),
                  scope,
                ),
              ),
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
                  scope,
                ),
                makePrimitiveExpression(null, hash),
                hash,
              ),
              liftSequenceX(
                flatenTree,
                unbuildEffect(
                  node.right,
                  forkMeta((meta = nextMeta(meta))),
                  scope,
                ),
              ),
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
          unbuildExpression(node, meta, scope),
          hash,
        ),
      );
    }
  }
};
