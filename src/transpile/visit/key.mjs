import { partialx___ } from "../../util/index.mjs";
import { DEFAULT_CLAUSE } from "../../node.mjs";
import { makeLiteralExpression } from "../../ast/index.mjs";
import { makeScopeBaseReadExpression } from "../scope/index.mjs";
import { expectSyntaxEqual } from "./report.mjs";
import { visit } from "./context.mjs";

const visitExpression = partialx___(visit, "Expression");

const ANONYMOUS = { name: null };

export default {
  Key: {
    Identifier: (node, context, { computed }) =>
      computed
        ? makeScopeBaseReadExpression(context, node.name)
        : makeLiteralExpression(node.name),
    Literal: (node, _context, _site) => makeLiteralExpression(node.value),
    [DEFAULT_CLAUSE]: (node, context, site) => {
      expectSyntaxEqual(site, "computed", true);
      return visitExpression(node, context, ANONYMOUS);
    },
  },
};
