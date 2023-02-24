import { SyntaxAranError, expect1, partialx__x } from "../../util/index.mjs";
import { DEFAULT_CLAUSE } from "../../node.mjs";
import { makeLiteralExpression } from "../../ast/index.mjs";
import { makeScopeBaseReadExpression } from "../scope/index.mjs";
import { visit } from "./context.mjs";

const visitExpression = partialx__x(visit, "expression", {
  dropped: true,
  name: null,
});

export default {
  Identifier: (node, context, { computed }) =>
    computed
      ? makeScopeBaseReadExpression(context, node.name)
      : makeLiteralExpression(node.name),
  Literal: (node, _context, _site) => makeLiteralExpression(node.value),
  [DEFAULT_CLAUSE]: (node, context, { computed }) => {
    expect1(
      computed,
      "illegal non-computed property at %j",
      SyntaxAranError,
      node.loc.start,
    );
    return visitExpression(node, context);
  },
};
