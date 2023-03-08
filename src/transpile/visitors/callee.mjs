import { reduceReverse } from "../../util/index.mjs";
import {
  makeApplyExpression,
  makeLiteralExpression,
  makeSequenceExpression,
  makeConditionalExpression,
} from "../../ast/index.mjs";
import { makeGetExpression, makeBinaryExpression } from "../../intrinsic.mjs";
import { makeScopeSpecReadExpression } from "../scope/index.mjs";
import { annotateCallee } from "../annotate.mjs";
import { expectSyntaxPropertyEqual } from "../report.mjs";
import { CALLEE, EXPRESSION, EXPRESSION_MEMO, getKeySite } from "../site.mjs";
import { visit } from "../context.mjs";

export default {
  __ANNOTATE__: annotateCallee,
  ChainExpression: (node, context, _site) =>
    visit(node.expression, context, CALLEE),
  MemberExpression: (node, context, _site) => {
    if (node.object.type === "Super") {
      expectSyntaxPropertyEqual(node, ["optional"], false);
      return {
        callee: makeApplyExpression(
          makeScopeSpecReadExpression(context, "super.get"),
          makeLiteralExpression({ undefined: null }),
          [visit(node.property, context, getKeySite(node.computed))],
        ),
        this: makeScopeSpecReadExpression(context, "this"),
      };
    } else {
      const memo = visit(node.object, context, {
        ...EXPRESSION_MEMO,
        info: "this",
      });
      return {
        callee: reduceReverse(
          memo.setup,
          makeSequenceExpression,
          node.optional
            ? makeConditionalExpression(
                makeConditionalExpression(
                  makeBinaryExpression(
                    "===",
                    memo.pure,
                    makeLiteralExpression(null),
                  ),
                  makeLiteralExpression(true),
                  makeBinaryExpression(
                    "===",
                    memo.pure,
                    makeLiteralExpression({ undefined: null }),
                  ),
                ),
                makeLiteralExpression({ undefined: null }),
                makeGetExpression(
                  memo.pure,
                  visit(node.property, context, getKeySite(node.computed)),
                ),
              )
            : makeGetExpression(
                memo.pure,
                visit(node.property, context, getKeySite(node.computed)),
              ),
        ),
        this: memo.pure,
      };
    }
  },
  __DEFAULT__: (node, context, _site) => ({
    callee: visit(node, context, EXPRESSION),
    this: makeLiteralExpression({ undefined: null }),
  }),
};
