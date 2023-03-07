import { makeLiteralExpression } from "../../ast/index.mjs";
import { annotate } from "./annotate.mjs";

export default {
  __ANNOTATE__: annotate,
  TemplateElement: (node, _context, _site) =>
    makeLiteralExpression(node.value.cooked),
};
