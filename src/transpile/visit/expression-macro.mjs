import { makeLiteralExpression } from "../../ast/index.mjs";
import { annotateMacro } from "./annotate.mjs";
import { makeMacro } from "./macro.mjs";
import { EXPRESSION } from "./site.mjs";
import { visit } from "./context.mjs";

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
