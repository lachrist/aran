import { reduceReverse } from "../../util/index.mjs";
import {
  makeSequenceExpression,
  makeLiteralExpression,
} from "../../ast/index.mjs";
import { makeBinaryExpression } from "../../intrinsic.mjs";
import { annotateProperty } from "../annotate.mjs";
import { expectSyntax } from "../report.mjs";
import { CLOSURE, EXPRESSION, getKeySite, getKeyMacroSite } from "../site.mjs";
import { visit } from "../context.mjs";

export default {
  __ANNOTATE__: annotateProperty,
  ArrowFunctionExpression: (node, context, site) => {
    expectSyntax(!site.method, node);
    expectSyntax(site.kind === "init", node);
    const macro = visit(site.key, context, getKeyMacroSite(site.computed));
    return {
      key: reduceReverse(macro.setup, makeSequenceExpression, macro.value),
      value: visit(node, context, {
        ...CLOSURE,
        kind: "arrow",
        self: site.self,
        name: macro.value,
      }),
    };
  },
  FunctionExpression: (node, context, site) => {
    const macro = visit(site.key, context, getKeyMacroSite(site.computed));
    return {
      key: reduceReverse(macro.setup, makeSequenceExpression, macro.value),
      value: visit(node, context, {
        ...CLOSURE,
        kind: site.method ? "method" : "function",
        self: site.self,
        name:
          site.kind === "init"
            ? macro.value
            : makeBinaryExpression(
                "+",
                makeLiteralExpression(`${site.kind} `),
                macro.value,
              ),
      }),
    };
  },
  __DEFAULT__: (node, context, site) => {
    expectSyntax(!site.method, node);
    expectSyntax(site.kind === "init", node);
    return {
      key: visit(site.key, context, getKeySite(site.computed)),
      value: visit(node, context, EXPRESSION),
    };
  },
};
