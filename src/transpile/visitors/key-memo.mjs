import { makeLiteralExpression } from "../../ast/index.mjs";
import { annotateMemo } from "../annotate.mjs";

export default {
  __ANNOTATE__: annotateMemo,
  Identifier: (node, _context, _site) => ({
    setup: [],
    pure: makeLiteralExpression(node.name),
  }),
  Literal: (node, _context, _site) => ({
    setup: [],
    pure: makeLiteralExpression(node.value),
  }),
};
