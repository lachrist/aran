import { makeLiteralExpression } from "../../ast/index.mjs";
import { makeMacro, annotateMacro } from "./macro.mjs";
import { visit, EXPRESSION } from "./context.mjs";

export default {
  __ANNOTATE__: annotateMacro,
  Literal: (node, _context, _site) => ({
    setup: [],
    value: makeLiteralExpression(node.value),
  }),
  __DEFAULT__: (node, context, site) =>
    makeMacro(
      context,
      site.info,
      visit(node, context, {
        ...EXPRESSION,
        name: site.name,
      }),
    ),
};
