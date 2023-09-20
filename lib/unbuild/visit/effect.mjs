import { StaticError, flatMap } from "../../util/index.mjs";

import {
  makeExpressionEffect,
  makePrimitiveExpression,
  makeConditionalEffect,
  makeWriteEffect,
} from "../node.mjs";

import { makeBinaryExpression } from "../intrinsic.mjs";

import { mangleMetaVariable } from "../mangle.mjs";

import { unbuildExpression } from "./expression.mjs";

import { unbuildPatternEffect } from "./pattern.mjs";

import { unbuildUpdateEffect } from "./update.mjs";

const {
  Reflect: { apply },
  String: {
    prototype: { slice: sliceString },
  },
} = globalThis;

const BASENAME = /** @basename */ "effect";

/**
 * @type {<S>(
 *   node: estree.Expression,
 *   context: import("./context.js").Context<S>,
 * ) => aran.Effect<unbuild.Atom<S>>[]}
 */
export const unbuildEffect = (node, context) => {
  const { serialize, digest } = context;
  const serial = serialize(node);
  const hash = digest(node);
  switch (node.type) {
    case "AssignmentExpression": {
      if (node.operator === "=") {
        const right = {
          var: mangleMetaVariable(hash, BASENAME, "right"),
          val: unbuildExpression(node.right, context, null),
        };
        return [
          makeWriteEffect(right.var, right.val, serial, true),
          ...unbuildPatternEffect(node.left, context, right.var),
        ];
      } else {
        return unbuildUpdateEffect(node.left, context, {
          update: unbuildExpression(node.right, context, null),
          operator: /** @type {estree.BinaryOperator} */ (
            apply(sliceString, node.operator, [0, -1])
          ),
          serial,
          hash,
        });
      }
    }
    case "UpdateExpression":
      return unbuildUpdateEffect(node.argument, context, {
        update: makePrimitiveExpression(1, serial),
        operator: /** @type {estree.BinaryOperator} */ (node.operator[0]),
        serial,
        hash,
      });
    case "SequenceExpression":
      return flatMap(node.expressions, (child) =>
        unbuildEffect(child, context),
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
        makeExpressionEffect(unbuildExpression(node, context, null), serial),
      ];
  }
};
