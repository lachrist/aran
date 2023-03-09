import { concat, flatMap } from "array-lite";
import { partial_xx } from "../../util/index.mjs";
import { makeScopeNormalStaticBlock } from "../scope/index.mjs";
import { annotate } from "../annotate.mjs";
import { BLOCK, STATEMENT } from "../site.mjs";
import { visit } from "../context.mjs";

export default {
  __ANNOTATE__: annotate,
  LabeledStatement: (node, context, { labels, completion }) =>
    visit(node.body, context, {
      ...BLOCK,
      labels: concat(labels, [node.label.name]),
      completion,
    }),
  BlockStatement: (node, context1, { labels, completion }) =>
    makeScopeNormalStaticBlock(context1, labels, (context2) =>
      flatMap(
        node.body,
        partial_xx(visit, context2, { ...STATEMENT, completion }),
      ),
    ),
  __DEFAULT__: (node, context1, { labels, completion }) =>
    makeScopeNormalStaticBlock(context1, labels, (context2) =>
      visit(node, context2, { ...STATEMENT, completion }),
    ),
};
