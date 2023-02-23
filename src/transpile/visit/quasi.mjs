import { makeLiteralExpression } from "../../ast/index.mjs";

export default {
  TemplateElement: (node, _context, _site) =>
    makeLiteralExpression(node.value.cooked),
};
