import { makeLiteralExpression } from "../../ast/index.mjs";
import { annotateMemo } from "../annotate.mjs";
import { memoize } from "../memoize.mjs";
import { EXPRESSION } from "../site.mjs";
import { visit } from "../context.mjs";

export default {
  __ANNOTATE__: annotateMemo,
  Literal: (node, _context, _site) => ({
    setup: [],
    pure: makeLiteralExpression(node.value),
  }),
  __DEFAULT__: (node, context, site) =>
    memoize(
      context,
      site.info,
      visit(node, context, {
        ...EXPRESSION,
        name: site.name,
      }),
    ),
};
