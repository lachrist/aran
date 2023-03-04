import { DEFAULT_CLAUSE } from "../../node.mjs";
import { annotateNode, makeLiteralExpression } from "../../ast/index.mjs";
import { makeScopeBaseReadExpression } from "../scope/index.mjs";
import { expectSyntaxEqual } from "./report.mjs";
import { visit } from "./context.mjs";

const EXPRESSION = { type: "Expression", name: "" };

export default {
  Key: {
    __ANNOTATE__: annotateNode,
    Identifier: (node, context, { computed }) =>
      computed
        ? makeScopeBaseReadExpression(context, node.name)
        : makeLiteralExpression(node.name),
    Literal: (node, _context, _site) => makeLiteralExpression(node.value),
    [DEFAULT_CLAUSE]: (node, context, site) => {
      expectSyntaxEqual(site, "computed", true);
      return visit(node, context, EXPRESSION);
    },
  },
};
