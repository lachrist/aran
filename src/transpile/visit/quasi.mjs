import { makeLiteralExpression } from "../../ast/index.mjs";

export default {
  Quasi: {
    TemplateElement: (node, _context, { cooked }) =>
      makeLiteralExpression(cooked ? node.value.cooked : node.value.raw),
  },
};
