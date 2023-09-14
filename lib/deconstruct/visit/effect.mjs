import { StaticError, flatMap } from "../../util/index.mjs";
import {
  makeExpressionEffect,
  makePrimitiveExpression,
  makeConditionalEffect,
  makeConditionalExpression,
} from "../../node.mjs";
import { makeBinaryExpression } from "../../intrinsic.mjs";
import { deconstructExpression } from "./expression.mjs";
import { makeMetaReadExpression, makeMetaWriteEffect, mangleMetaVariable } from "../layer/index.mjs";
import { listScopeWriteEffect } from "../scope/index.mjs";

const DUMMY = "dummy";

/** @type {<S>(node: estree.Expression, context: import("./context.d.ts").Context<S>) => Effect<S>[]} */
export const deconstructEffect = (node, context) => {
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
              deconstructExpression(node.right, context, /** @type {Variable} */ (node.left.name)),
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
          deconstructExpression(
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
          deconstructExpression(node.left, context, null),
          serial,
        );
        return [
          ...memo.save,
          ...deconstructAssignmentEffect(node, context, memo.load),
        ];
      }
    case "UpdateExpression":
      return deconstructUpdateEffect();
    case "SequenceExpression":
      return flatMap(node.expressions, (node) =>
        deconstructEffect(node, context),
      );
    case "ConditionalExpression":
      return [
        makeConditionalEffect(
          deconstructExpression(node.test, context, null),
          deconstructEffect(node.consequent, context),
          deconstructEffect(node.alternate, context),
          serial,
        ),
      ];
    case "LogicalExpression":
      switch (node.operator) {
        case "&&":
          return [
            makeConditionalEffect(
              deconstructExpression(node.left, context, null),
              deconstructEffect(node.right, context),
              [],
              serial,
            ),
          ];
        case "||":
          return [
            makeConditionalEffect(
              deconstructExpression(node.left, context, null),
              [],
              deconstructEffect(node.right, context),
              serial,
            ),
          ];
        case "??":
          return [
            makeConditionalEffect(
              makeBinaryExpression(
                "==",
                deconstructExpression(node.left, context, null),
                makePrimitiveExpression(null, serial),
                serial,
              ),
              deconstructEffect(node.right, context),
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
          deconstructExpression(node, context, null),
          serial,
        ),
      ];
  }
};
