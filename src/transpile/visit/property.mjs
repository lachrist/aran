import { makeLiteralExpression } from "../../ast/index.mjs";

export default {
  Identifier: (node, _context, _site) => makeLiteralExpression(node.name),
  Literal: (node, _context, _site) => makeLiteralExpression(node.value),
};
