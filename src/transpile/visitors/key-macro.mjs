import { makeLiteralExpression } from "../../ast/index.mjs";
import { annotateMacro } from "../annotate.mjs";

export default {
  __ANNOTATE__: annotateMacro,
  Identifier: (node, _context, _site) => ({
    setup: [],
    pure: makeLiteralExpression(node.name),
  }),
  Literal: (node, _context, _site) => ({
    setup: [],
    pure: makeLiteralExpression(node.value),
  }),
};
