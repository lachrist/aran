import { StaticError, flatMap } from "../../util/index.mjs";

import {
  makeExpressionEffect,
  makePrimitiveExpression,
  makeConditionalEffect,
  makeWriteEffect,
} from "../node.mjs";

import {
  makeBinaryExpression,
  makeThrowErrorExpression,
} from "../intrinsic.mjs";

import { mangleMetaVariable } from "../mangle.mjs";

import { unbuildExpression } from "./expression.mjs";

import { unbuildPatternEffect } from "./pattern.mjs";

import { unbuildUpdateEffect } from "./update.mjs";
import { unbuildArrowFunction, unbuildFunctionFunction } from "./function.mjs";

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
        // > (console.log('foo') = 123);
        // foo
        // Uncaught ReferenceError: Invalid left-hand side in assignment
        if (
          /** @type {estree.Expression} */ (node.left).type === "CallExpression"
        ) {
          return [
            ...unbuildEffect(
              /** @type {estree.Expression} */ (node.left),
              context,
            ),
            makeExpressionEffect(
              makeThrowErrorExpression(
                "ReferenceError",
                "Invalid left-hand side in assignment",
                serial,
              ),
              serial,
            ),
          ];
        } else {
          const right = {
            var: mangleMetaVariable(hash, BASENAME, "right"),
            val:
              node.left.type === "Identifier" &&
              node.right.type === "ArrowFunctionExpression"
                ? unbuildArrowFunction(node.right, context, {
                    name: makePrimitiveExpression(node.left.name, serial),
                  })
                : node.left.type === "Identifier" &&
                  node.right.type === "FunctionExpression"
                ? unbuildFunctionFunction(node.right, context, {
                    name: makePrimitiveExpression(node.left.name, serial),
                  })
                : unbuildExpression(node.right, context),
          };
          return [
            makeWriteEffect(right.var, right.val, serial, true),
            ...unbuildPatternEffect(node.left, context, right.var),
          ];
        }
      } else {
        return unbuildUpdateEffect(node.left, context, {
          update: unbuildExpression(node.right, context),
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
          unbuildExpression(node.test, context),
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
              unbuildExpression(node.left, context),
              unbuildEffect(node.right, context),
              [],
              serial,
            ),
          ];
        case "||":
          return [
            makeConditionalEffect(
              unbuildExpression(node.left, context),
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
                unbuildExpression(node.left, context),
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
      return [makeExpressionEffect(unbuildExpression(node, context), serial)];
  }
};