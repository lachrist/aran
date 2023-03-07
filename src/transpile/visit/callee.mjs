import { reduceReverse } from "../../util/index.mjs";
import {
  annotateNode,
  makeApplyExpression,
  makeLiteralExpression,
  makeSequenceExpression,
  makeConditionalExpression,
} from "../../ast/index.mjs";
import { makeGetExpression, makeBinaryExpression } from "../../intrinsic.mjs";
import {
  makeScopeMetaReadExpression,
  makeScopeMetaWriteEffectArray,
  makeScopeSpecReadExpression,
  declareScopeMeta,
} from "../scope/index.mjs";
import { expectSyntaxPropertyEqual } from "./report.mjs";
import { visit, CALLEE, EXPRESSION, getKeySite } from "./context.mjs";

export default {
  __ANNOTATE__: ({ callee: expression1, this: expression2 }, serial) => ({
    callee: annotateNode(expression1, serial),
    this: annotateNode(expression2, serial),
  }),
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
      const variable = declareScopeMeta(context, "callee_this");
      return {
        callee: reduceReverse(
          makeScopeMetaWriteEffectArray(
            context,
            variable,
            visit(node.object, context, EXPRESSION),
          ),
          makeSequenceExpression,
          node.optional
            ? makeConditionalExpression(
                makeConditionalExpression(
                  makeBinaryExpression(
                    "===",
                    makeScopeMetaReadExpression(context, variable),
                    makeLiteralExpression(null),
                  ),
                  makeLiteralExpression(true),
                  makeBinaryExpression(
                    "===",
                    makeScopeMetaReadExpression(context, variable),
                    makeLiteralExpression({ undefined: null }),
                  ),
                ),
                makeLiteralExpression({ undefined: null }),
                makeGetExpression(
                  makeScopeMetaReadExpression(context, variable),
                  visit(node.property, context, getKeySite(node.computed)),
                ),
              )
            : makeGetExpression(
                makeScopeMetaReadExpression(context, variable),
                visit(node.property, context, getKeySite(node.computed)),
              ),
        ),
        this: makeScopeMetaReadExpression(context, variable),
      };
    }
  },
  __DEFAULT__: (node, context, _site) => ({
    callee: visit(node, context, EXPRESSION),
    this: makeLiteralExpression({ undefined: null }),
  }),
};
