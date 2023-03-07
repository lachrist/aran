import { makeLiteralExpression } from "../../ast/index.mjs";
import { declareScopeMeta } from "../scope/index.mjs";
import { visit, annotateMacro, EXPRESSION } from "./context.mjs";

export default {
  __ANNOTATE__: annotateMacro,
  Literal: (node, _context, _site) => ({
    setup: [],
    value: makeLiteralExpression(node.value),
  }),
  __DEFAULT__: (node, context, site) =>
    declareScopeMeta(
      context,
      site.info,
      visit(node, context, {
        ...EXPRESSION,
        name: site.name,
      }),
    ),
};
