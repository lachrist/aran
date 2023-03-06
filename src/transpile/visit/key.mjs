import { annotateNode, makeLiteralExpression } from "../../ast/index.mjs";

export default {
  __ANNOTATE__: annotateNode,
  Identifier: (node, _context, _site) => makeLiteralExpression(node.name),
  Literal: (node, _context, _site) => makeLiteralExpression(node.value),
};
