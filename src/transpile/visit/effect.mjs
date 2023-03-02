import { flatMap, reduceRight, slice } from "array-lite";
import { flipxx, partial_xx, partialx___ } from "../../util/index.mjs";
import { DEFAULT_CLAUSE } from "../../node.mjs";
import {
  makeExpressionEffect,
  makeLiteralExpression,
  makeSequenceEffect,
  makeConditionalEffect,
  makeConditionalExpression,
} from "../../ast/index.mjs";
import { makeBinaryExpression } from "../../intrinsic.mjs";
import {
  declareScopeMeta,
  makeScopeMetaWriteEffect,
  makeScopeMetaReadExpression,
} from "../scope/index.mjs";
import { makeSyntaxError } from "./report.mjs";
import { visit, visitMany } from "./context.mjs";

const ANONYMOUS = { name: null };

const visitExpression = partialx___(visit, "Expression");
const visitEffect = partialx___(visitMany, "Effect");
const visitUpdateEffect = partialx___(visitMany, "UpdateEffect");
const visitAssignmentEffect = partialx___(visitMany, "AssignmentEffect");

const makeSequenceEffectFlip = flipxx(makeSequenceEffect);

const unifyEffectArray = (effects) => {
  if (effects.length === 0) {
    return makeExpressionEffect(makeLiteralExpression({ undefined: null }));
  } else {
    return reduceRight(
      slice(effects, 0, effects.length - 1),
      makeSequenceEffectFlip,
      effects[effects.length - 1],
    );
  }
};

export default {
  Effect: {
    AssignmentExpression: (node, context, _site) =>
      visitAssignmentEffect(node.left, context, node),
    UpdateExpression: (node, context, _site) =>
      visitUpdateEffect(node.argument, context, node),
    SequenceExpression: (node, context, _site) =>
      flatMap(node.expressions, partial_xx(visitEffect, context, null)),
    ConditionalExpression: (node, context, _site) => [
      makeConditionalEffect(
        visitExpression(node.test, context, ANONYMOUS),
        unifyEffectArray(visitEffect(node.consequent, context, null)),
        unifyEffectArray(visitEffect(node.alternate, context, null)),
      ),
    ],
    LogicalExpression: (node, context, _site) => {
      if (node.operator === "&&") {
        return [
          makeConditionalEffect(
            visitExpression(node.left, context, ANONYMOUS),
            unifyEffectArray(visitEffect(node.right, context, null)),
            unifyEffectArray([]),
          ),
        ];
      } else if (node.operator === "||") {
        return [
          makeConditionalEffect(
            visitExpression(node.left, context, ANONYMOUS),
            unifyEffectArray([]),
            unifyEffectArray(visitEffect(node.right, context, null)),
          ),
        ];
      } else if (node.operator === "??") {
        const variable = declareScopeMeta(
          context,
          "EffectSequenceExpressionLeft",
        );
        return [
          makeScopeMetaWriteEffect(
            context,
            variable,
            visitExpression(node.left, context, null),
          ),
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
            unifyEffectArray(visitEffect(node.right, context, null)),
            unifyEffectArray([]),
          ),
        ];
      } /* c8 ignore start */ else {
        throw makeSyntaxError(node, "operator");
      } /* c8 ignore stop */
    },
    [DEFAULT_CLAUSE]: (node, context, _site) => [
      makeExpressionEffect(visitExpression(node, context, ANONYMOUS)),
    ],
  },
};
