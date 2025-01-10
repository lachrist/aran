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
  listExpressionEffect,
} from "../node.mjs";
import {
  makeBinaryExpression,
  makeThrowErrorExpression,
} from "../intrinsic.mjs";
import { transExpression, transNameExpression } from "./expression.mjs";
import { transWritePattern } from "./pattern.mjs";
import { UPDATE_OPERATOR_RECORD, transUpdateEffect } from "./update.mjs";
import { forkMeta, nextMeta } from "../meta.mjs";
import { listSetMemberEffect } from "../member.mjs";
import { transObject } from "./object.mjs";
import { transKey } from "./key.mjs";
import { makeEffectAssigner } from "../assigner.mjs";
import { ANONYMOUS_NAME } from "../name.mjs";

const LOGICAL_ASSIGNMENT_OPERATOR_RECORD = {
  "||=": null,
  "&&=": null,
  "??=": null,
};

/**
 * @type {(
 *   node: import("estree-sentry").Expression<import("../hash").HashProp>,
 *   meta: import("../meta").Meta,
 *   scope: import("../scope").Scope,
 * ) => import("../../util/sequence").Sequence<
 *   import("../prelude").BodyPrelude,
 *   import("../../util/tree").Tree<import("../atom").Effect>,
 * >}
 */
export const transEffect = (node, meta, scope) => {
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
            transEffect(node.left, forkMeta((meta = nextMeta(meta))), scope),
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
            transObject(
              ts_node_left.object,
              forkMeta((meta = nextMeta(meta))),
              scope,
            ),
            (object) =>
              bindSequence(
                transKey(
                  ts_node_left.property,
                  forkMeta((meta = nextMeta(meta))),
                  scope,
                  ts_node_left.computed,
                ),
                (key) =>
                  bindSequence(
                    transExpression(
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
            transWritePattern,
            node.left,
            forkMeta((meta = nextMeta(meta))),
            scope,
            transNameExpression(
              node.right,
              forkMeta((meta = nextMeta(meta))),
              scope,
              name,
            ),
          );
        }
      } else {
        return callSequence___X(
          transUpdateEffect,
          node.left,
          forkMeta((meta = nextMeta(meta))),
          scope,
          liftSequence__X(
            makeEffectAssigner,
            "discard",
            UPDATE_OPERATOR_RECORD[node.operator],
            transNameExpression(
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
      return transUpdateEffect(
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
          transEffect(node, forkMeta((meta = nextMeta(meta))), scope),
        ),
      );
    }
    case "ConditionalExpression": {
      return liftSequenceXXX_(
        makeConditionalEffect,
        transExpression(node.test, forkMeta((meta = nextMeta(meta))), scope),
        liftSequenceX(
          flatenTree,
          transEffect(
            node.consequent,
            forkMeta((meta = nextMeta(meta))),
            scope,
          ),
        ),
        liftSequenceX(
          flatenTree,
          transEffect(node.alternate, forkMeta((meta = nextMeta(meta))), scope),
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
              transExpression(
                node.left,
                forkMeta((meta = nextMeta(meta))),
                scope,
              ),
              liftSequenceX(
                flatenTree,
                transEffect(
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
              transExpression(
                node.left,
                forkMeta((meta = nextMeta(meta))),
                scope,
              ),
              EMPTY,
              liftSequenceX(
                flatenTree,
                transEffect(
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
                transExpression(
                  node.left,
                  forkMeta((meta = nextMeta(meta))),
                  scope,
                ),
                makePrimitiveExpression(null, hash),
                hash,
              ),
              liftSequenceX(
                flatenTree,
                transEffect(
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
      return liftSequenceX_(
        listExpressionEffect,
        transExpression(node, meta, scope),
        hash,
      );
    }
  }
};
