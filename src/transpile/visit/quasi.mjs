import { makeLiteralExpression } from "../../ast/index.mjs";

export default {
  TemplateElement: (node, _context, { cooked }) =>
    makeLiteralExpression(cooked ? node.value.cooked : node.value.raw),
};
