import { flatMap, concat } from "array-lite";
import { partial_xx } from "../../util/index.mjs";
import {
  makeExpressionEffect,
  makeLiteralExpression,
  makeConditionalEffect,
  makeConditionalExpression,
} from "../../ast/index.mjs";
import { makeBinaryExpression } from "../../intrinsic.mjs";
import { annotateArray } from "../annotate.mjs";
import { makeSyntaxError } from "../report.mjs";
import {
  EFFECT,
  EXPRESSION,
  EXPRESSION_MEMO,
  ASSIGNMENT_EFFECT,
  UPDATE_EFFECT,
} from "../site.mjs";
import { visit } from "../context.mjs";

export default {
  __ANNOTATE__: annotateArray,
  AssignmentExpression: (node, context, _site) =>
    visit(node.left, context, {
      ...ASSIGNMENT_EFFECT,
      operator: node.operator,
      right: node.right,
    }),
  UpdateExpression: (node, context, _site) =>
    visit(node.argument, context, {
      ...UPDATE_EFFECT,
      operator: node.operator,
      prefix: node.prefix,
    }),
  SequenceExpression: (node, context, _site) =>
    flatMap(node.expressions, partial_xx(visit, context, EFFECT)),
  ConditionalExpression: (node, context, _site) => [
    makeConditionalEffect(
      visit(node.test, context, EXPRESSION),
      visit(node.consequent, context, EFFECT),
      visit(node.alternate, context, EFFECT),
    ),
  ],
  LogicalExpression: (node, context, _site) => {
    if (node.operator === "&&") {
      return [
        makeConditionalEffect(
          visit(node.left, context, EXPRESSION),
          visit(node.right, context, EFFECT),
          [],
        ),
      ];
    } else if (node.operator === "||") {
      return [
        makeConditionalEffect(
          visit(node.left, context, EXPRESSION),
          [],
          visit(node.right, context, EFFECT),
        ),
      ];
    } else if (node.operator === "??") {
      const memo = visit(node.left, context, {
        ...EXPRESSION_MEMO,
        info: "coalesce",
      });
      return concat(memo.setup, [
        makeConditionalEffect(
          makeConditionalExpression(
            makeBinaryExpression("===", memo.pure, makeLiteralExpression(null)),
            makeLiteralExpression(true),
            makeBinaryExpression(
              "===",
              memo.pure,
              makeLiteralExpression({ undefined: null }),
            ),
          ),
          visit(node.right, context, EFFECT),
          [],
        ),
      ]);
    } /* c8 ignore start */ else {
      throw makeSyntaxError(node, "operator");
    } /* c8 ignore stop */
  },
  __DEFAULT__: (node, context, _site) => [
    makeExpressionEffect(visit(node, context, EXPRESSION)),
  ],
};

import { StaticError, hasOwn } from "../../util/index.mjs";

import {
  makeApplyExpression,
  makeAwaitExpression,
  makeIntrinsicExpression,
  makePrimitiveExpression,
  makeYieldExpression,
} from "../../node.mjs";

import { makeBinaryExpression, makeUnaryExpression } from "../../intrinsic.mjs";

import {
  makeScopeReadExpression,
  makeScopeTypeofExpression,
} from "../scope/index.mjs";

/**
 * @type {<S>(
 *   node: estree.Expression,
 *   context: import("./context.d.ts").Context<S>,
 * ) => Effect<S>[]}
 */
export const deconstructExpression = (node, context, _name) => {
  const serial = context.serialize(node);
  switch (node.type) {
    case "Literal":
      if (hasOwn(node, "regex")) {
        return makeApplyExpression(
          makeIntrinsicExpression("RegExp", serial),
          makePrimitiveExpression({ undefined: null }, serial),
          [
            makePrimitiveExpression(node.regex.pattern, serial),
            makePrimitiveExpression(node.regex.flags, serial),
          ],
          serial,
        );
      } else if (hasOwn(node, "bigint")) {
        return makePrimitiveExpression({ bigint: node.bigint }, serial);
      } else {
        return makePrimitiveExpression(node.value, serial);
      }
    case "Identifier":
      return makeScopeReadExpression(
        context.strict,
        context.scope,
        /** @type {Variable} */ (node.name),
        serial,
      );
    case "UnaryExpression":
      switch (node.operator) {
        case "typeof":
          return node.argument.type === "Identifier"
            ? makeScopeTypeofExpression(
                context.strict,
                context.scope,
                /** @type {Variable} */ (node.argument.name),
                serial,
              )
            : makeUnaryExpression(
                node.operator,
                deconstructExpression(node.argument, context, null),
                serial,
              );
        case "delete":
          return TODO;
        default:
          return makeUnaryExpression(
            node.operator,
            deconstructExpression(node.argument, context, null),
            serial,
          );
      }
    case "BinaryExpression":
      return makeBinaryExpression(
        node.operator,
        deconstructExpression(node.left, context, null),
        deconstructExpression(node.right, context, null),
        serial,
      );
    case "AwaitExpression":
      return makeAwaitExpression(
        deconstructExpression(node.argument, context, null),
        serial,
      );
    case "YieldExpression":
      return makeYieldExpression(
        node.delegate,
        node.argument == null
          ? makePrimitiveExpression({ undefined: null }, serial)
          : deconstructExpression(node.argument, context, null),
        serial,
      );
    default:
      throw new StaticError("invalid estree expression node", node);
  }
};
