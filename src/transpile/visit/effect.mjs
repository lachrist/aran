import { partialx___ } from "../../util/index.mjs";
import { DEFAULT_CLAUSE } from "../../node.mjs";
import { makeExpressionEffect } from "../../ast/index.mjs";
import { visit, visitMany } from "./context.mjs";

const ANONYMOUS = { name: null };

const visitExpression = partialx___(visit, "Expression");
const visitEffect = partialx___(visitMany, "Effect");
const visitUpdateEffect = partialx___(visitMany, "UpdateEffect");
const visitAssignmentEffect = partialx___(visitMany, "AssignmentEffect");

export default {
  Effect: {
    AssignmentExpression: (node, context, _site) =>
      visitAssignmentEffect(node.left, context, node),
    UpdateExpression: (node, context, _site) =>
      visitUpdateEffect(node.argument, context, node),
    SequenceExpression: (node, context, _site) =>
      flatMap(node.expressions, partial_xx(visitEffect, context, null)),
    [DEFAULT_CLAUSE]: (node, context, _site) => [
      makeExpressionEffect(visitExpression(node, context, ANONYMOUS)),
    ],
  },
};
