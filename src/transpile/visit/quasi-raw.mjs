import { annotateNode, makeLiteralExpression } from "../../ast/index.mjs";

export default {
  __ANNOTATE__: annotateNode,
  TemplateElement: (node, _context, _site) =>
    makeLiteralExpression(node.value.raw),
};
