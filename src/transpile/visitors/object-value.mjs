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
      key: reduceReverse(macro.setup, makeSequenceExpression, macro.pure),
      value: visit(node, context, {
        ...CLOSURE,
        kind: "arrow",
        super: site.super,
        name: macro.pure,
      }),
    };
  },
  FunctionExpression: (node, context, site) => {
    const macro = visit(site.key, context, getKeyMacroSite(site.computed));
    return {
      key: reduceReverse(macro.setup, makeSequenceExpression, macro.pure),
      value: visit(node, context, {
        ...CLOSURE,
        kind: site.method ? "method" : "function",
        super: site.super,
        name:
          site.kind === "init"
            ? macro.pure
            : makeBinaryExpression(
                "+",
                makeLiteralExpression(`${site.kind} `),
                macro.pure,
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
