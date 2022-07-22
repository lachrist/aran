import {includes, concat} from "array-lite";

import {partialxx___} from "../../util/index.mjs";

import {
  makeDebuggerStatement,
  makeEffectStatement,
  makeExpressionEffect,
} from "../../ast/index.mjs";

import {makeMetaWriteEffect} from "../scope/index.mjs";

import {getContextScoping} from "./context.mjs";

import {applyArrayVisitor} from "./visit.mjs";

import {visitExpression} from "./expression.mjs";

export const visitStatement = partialxx___(
  applyArrayVisitor,
  {
    DebuggerStatement: (_node, _context, {}) => [makeDebuggerStatement()],
    EmptyStatement: (_node, _context, {}) => [],
    LabeledStatement: (node, context, {completion, labels}) =>
      visitStatement(node, context, {
        completion,
        labels: concat(labels, [node.label.name]),
      }),
    ExpressionStatement: (node, context, {completion}) => {
      if (completion !== null && includes(completion.nodes, node)) {
        return [
          makeEffectStatement(
            makeMetaWriteEffect(
              getContextScoping(context),
              completion.meta,
              visitExpression(node.expression, context, null),
            ),
          ),
        ];
      } else {
        return [
          makeEffectStatement(
            makeExpressionEffect(
              visitExpression(node.expression, context, {dropped: true}),
            ),
          ),
        ];
      }
    },
  },
  {
    labels: [],
    completion: null,
  },
);
