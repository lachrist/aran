import { makeLiteralExpression } from "../../ast/index.mjs";
import { annotate } from "./annotate.mjs";

export default {
  __ANNOTATE__: annotate,
  Identifier: (node, _context, _site) => makeLiteralExpression(node.name),
  Literal: (node, _context, _site) => makeLiteralExpression(node.value),
};
