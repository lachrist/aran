import { map, includes, concat } from "array-lite";
import {
  makeBlockStatement,
  makeDebuggerStatement,
  makeEffectStatement,
} from "../../ast/index.mjs";
import { makeScopeMetaWriteEffectArray } from "../scope/index.mjs";
import { annotateArray } from "../annotate.mjs";
import { BLOCK, STATEMENT, EFFECT, EXPRESSION } from "../site.mjs";
import { visit } from "../context.mjs";

export default {
  __ANNOTATE__: annotateArray,
  DebuggerStatement: (_node, _context, _site) => [makeDebuggerStatement()],
  EmptyStatement: (_node, _context, {}) => [],
  LabeledStatement: (node, context, { completion, labels }) =>
    visit(node.body, context, {
      ...STATEMENT,
      completion,
      labels: concat(labels, [node.label.name]),
    }),
  BlockStatement: (node, context, { completion, labels }) => [
    makeBlockStatement(visit(node, context, { ...BLOCK, completion, labels })),
  ],
  ExpressionStatement: (node, context, { completion }) => {
    if (completion !== null && includes(completion.nodes, node)) {
      return map(
        makeScopeMetaWriteEffectArray(
          context,
          completion.meta,
          visit(node.expression, context, EXPRESSION),
        ),
        makeEffectStatement,
      );
    } else {
      return map(visit(node.expression, context, EFFECT), makeEffectStatement);
    }
  },
};
