import { reduceReverse } from "../../util/index.mjs";
import {
  makeSequenceExpression,
  makeLiteralExpression,
} from "../../ast/index.mjs";
import { makeBinaryExpression } from "../../intrinsic.mjs";
import { annotateProperty } from "../annotate.mjs";
import { expectSyntax } from "../report.mjs";
import { CLOSURE, EXPRESSION, getKeySite, getKeyMemoSite } from "../site.mjs";
import { visit } from "../context.mjs";

export default {
  __ANNOTATE__: annotateProperty,
  ArrowFunctionExpression: (node, context, site) => {
    expectSyntax(!site.method, node);
    expectSyntax(site.kind === "init", node);
    const memo = visit(site.key, context, getKeyMemoSite(site.computed));
    return {
      key: reduceReverse(memo.setup, makeSequenceExpression, memo.pure),
      value: visit(node, context, {
        ...CLOSURE,
        kind: "arrow",
        super: site.super,
        name: memo.pure,
      }),
    };
  },
  FunctionExpression: (node, context, site) => {
    const memo = visit(site.key, context, getKeyMemoSite(site.computed));
    return {
      key: reduceReverse(memo.setup, makeSequenceExpression, memo.pure),
      value: visit(node, context, {
        ...CLOSURE,
        kind: site.method ? "method" : "function",
        super: site.super,
        name:
          site.kind === "init"
            ? memo.pure
            : makeBinaryExpression(
                "+",
                makeLiteralExpression(`${site.kind} `),
                memo.pure,
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
