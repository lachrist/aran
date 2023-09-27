import { concat, flatMap } from "array-lite";
import { partial_xx } from "../../util/index.mjs";
import { makeScopeNormalStaticBlock } from "../scope/index.mjs";
import { annotate } from "../annotate.mjs";
import { BLOCK, STATEMENT } from "../site.mjs";
import { visit } from "../context.mjs";

export default {
  __ANNOTATE__: annotate,
  LabeledStatement: (node, context, { type: _type, labels, ...rest }) =>
    visit(node.body, context, {
      ...BLOCK,
      ...rest,
      labels: concat(labels, [node.label.name]),
    }),
  BlockStatement: (node, context1, { type: _type, labels, ...rest }) =>
    makeScopeNormalStaticBlock(context1, labels, (context2) =>
      flatMap(
        node.body,
        partial_xx(visit, context2, { ...STATEMENT, ...rest }),
      ),
    ),
  __DEFAULT__: (node, context1, { type: _type, labels, ...rest }) =>
    makeScopeNormalStaticBlock(context1, labels, (context2) =>
      visit(node, context2, { ...STATEMENT, ...rest }),
    ),
};
