import { makeLiteralExpression } from "../../ast/index.mjs";
import { annotateMacro } from "../annotate.mjs";

export default {
  __ANNOTATE__: annotateMacro,
  Identifier: (node, _context, _site) => ({
    setup: [],
    value: makeLiteralExpression(node.name),
  }),
  Literal: (node, _context, _site) => ({
    setup: [],
    value: makeLiteralExpression(node.value),
  }),
};
