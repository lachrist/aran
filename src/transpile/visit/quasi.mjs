import { annotateNode, makeLiteralExpression } from "../../ast/index.mjs";

export default {
  __ANNOTATE__: annotateNode,
  TemplateElement: (node, _context, { cooked }) =>
    makeLiteralExpression(cooked ? node.value.cooked : node.value.raw),
};
