import { StaticError, flatMap } from "../../util/index.mjs";
import {
  makeExpressionEffect,
  makePrimitiveExpression,
  makeConditionalEffect,
  makeConditionalExpression,
} from "../../node.mjs";
import { makeBinaryExpression } from "../../intrinsic.mjs";
import { unbuildExpression } from "./expression.mjs";
import { makeMetaReadExpression, makeMetaWriteEffect, mangleMetaVariable } from "../layer/index.mjs";
import { listScopeWriteEffect } from "../scope/index.mjs";

const DUMMY = "dummy";

/** @type {<S>(node: estree.Expression, context: import("./context.js").Context<S>) => Effect<S>[]} */
export const unbuildEffect = (node, context) => {
  const { serialize, digest } = context;
  const serial = serialize(node);
  const hash = digest(node);
  switch (node.type) {
    case "AssignmentExpression":
      if (node.left.name === "Identifier") {
        const gauge = listScopeWriteEffect(
          context.strict,
          context.scope,
          node.left.name,
          makePrimitiveExpression(DUMMY, serial),
          serial,
        );
        if (gauge.length === 0 && gauge[0].type === "WriteEffect" && gauge[0].right.type === "PrimitiveExpression" && gauge[0].right.primitive === DUMMY) {
          return {};
      }
      if (node.operator === "=" && node.left.type === "Identifier") {

        } else {
          const right = mangleMetaVariable(hash, "effect", "right");
          return [
            makeMetaWriteEffect(
              right,
              unbuildExpression(node.right, context, /** @type {Variable} */ (node.left.name)),
              serial,
            ),
            ...listScopeWriteEffect(
              context.strict,
              context.scope,
              /** @type {Variable} */ (node.left.name),
              makeMetaReadExpression(right, serial),
              serial,
            ),
          ];
        }
      } else {

      }

        return listMemoScopeWriteEffect(
          context.strict,
          context.scope,
          {
            base: node.left.name,
            meta: mangleMetaVariable(hash, "effect", "right"),
          },
          unbuildExpression(
            node.right,
            context,
            /** @type {Variable} */ (node.left.name),
          ),
          serial,
        );
      } else {
        const memo = memoize(
          context.strict,
          context.scope,
          context.mangle(node, "assignment_effect", "result"),
          unbuildExpression(node.left, context, null),
          serial,
        );
        return [
          ...memo.save,
          ...unbuildAssignmentEffect(node, context, memo.load),
        ];
      }
    case "UpdateExpression":
      return unbuildUpdateEffect();
    case "SequenceExpression":
      return flatMap(node.expressions, (node) =>
        unbuildEffect(node, context),
      );
    case "ConditionalExpression":
      return [
        makeConditionalEffect(
          unbuildExpression(node.test, context, null),
          unbuildEffect(node.consequent, context),
          unbuildEffect(node.alternate, context),
          serial,
        ),
      ];
    case "LogicalExpression":
      switch (node.operator) {
        case "&&":
          return [
            makeConditionalEffect(
              unbuildExpression(node.left, context, null),
              unbuildEffect(node.right, context),
              [],
              serial,
            ),
          ];
        case "||":
          return [
            makeConditionalEffect(
              unbuildExpression(node.left, context, null),
              [],
              unbuildEffect(node.right, context),
              serial,
            ),
          ];
        case "??":
          return [
            makeConditionalEffect(
              makeBinaryExpression(
                "==",
                unbuildExpression(node.left, context, null),
                makePrimitiveExpression(null, serial),
                serial,
              ),
              unbuildEffect(node.right, context),
              [],
              serial,
            ),
          ];
        default:
          throw new StaticError("invalid logical operator", node);
      }
    default:
      return [
        makeExpressionEffect(
          unbuildExpression(node, context, null),
          serial,
        ),
      ];
  }
};
