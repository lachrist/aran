import { map, includes, concat } from "array-lite";
import { partial__x, constant_ } from "../../util/index.mjs";
import {
  makeBlockStatement,
  makeDebuggerStatement,
  makeEffectStatement,
  makeIfStatement,
} from "../../ast/index.mjs";
import {
  makeScopeMetaWriteEffectArray,
  makeScopeNormalStaticBlock,
} from "../scope/index.mjs";
import { annotateArray } from "../annotate.mjs";
import { BLOCK, STATEMENT, EFFECT, EXPRESSION } from "../site.mjs";
import { visit } from "../context.mjs";

const makeEmptyBlock = partial__x(makeScopeNormalStaticBlock, constant_([]));

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
  BlockStatement: (node, context, { completion, labels }) => [
    makeBlockStatement(visit(node, context, { ...BLOCK, completion, labels })),
  ],
  IfStatement: (node, context, { completion, labels }) => [
    makeIfStatement(
      visit(node.test, context, EXPRESSION),
      visit(node.consequent, context, { ...BLOCK, completion, labels }),
      node.alternate === null
        ? makeEmptyBlock(context, labels)
        : visit(node.alternate, context, { ...BLOCK, completion, labels }),
    ),
  ],
};
