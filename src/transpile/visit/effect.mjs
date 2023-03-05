import { flatMap, concat } from "array-lite";
import { partial_xx } from "../../util/index.mjs";
import { DEFAULT_CLAUSE } from "../../node.mjs";
import {
  makeExpressionEffect,
  makeLiteralExpression,
  makeConditionalEffect,
  makeConditionalExpression,
} from "../../ast/index.mjs";
import { makeBinaryExpression } from "../../intrinsic.mjs";
import {
  declareScopeMeta,
  makeScopeMetaWriteEffectArray,
  makeScopeMetaReadExpression,
} from "../scope/index.mjs";
import { makeSyntaxError } from "./report.mjs";
import { annotateNodeArray, visit, EFFECT, EXPRESSION } from "./context.mjs";

export default {
  __ANNOTATE__: annotateNodeArray,
  AssignmentExpression: (node, context, _site) =>
    visit(node.left, context, {
      type: "AssignmentEffect",
      operator: node.operator,
      right: node.right,
    }),
  UpdateExpression: (node, context, _site) =>
    visit(node.argument, context, {
      type: "UpdateEffect",
      operator: node.operator,
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
      const variable = declareScopeMeta(
        context,
        "EffectSequenceExpressionLeft",
      );
      return concat(
        makeScopeMetaWriteEffectArray(
          context,
          variable,
          visit(node.left, context, EXPRESSION),
        ),
        [
          makeConditionalEffect(
            makeConditionalExpression(
              makeBinaryExpression(
                "===",
                makeScopeMetaReadExpression(context, variable),
                makeLiteralExpression(null),
              ),
              makeLiteralExpression(true),
              makeBinaryExpression(
                "===",
                makeScopeMetaReadExpression(context, variable),
                makeLiteralExpression({ undefined: null }),
              ),
            ),
            visit(node.right, context, EFFECT),
            [],
          ),
        ],
      );
    } /* c8 ignore start */ else {
      throw makeSyntaxError(node, "operator");
    } /* c8 ignore stop */
  },
  [DEFAULT_CLAUSE]: (node, context, _site) => [
    makeExpressionEffect(visit(node, context, EXPRESSION)),
  ],
};
