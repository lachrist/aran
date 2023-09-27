import { concat } from "array-lite";
import {
  makeExpressionEffect,
  makeLiteralExpression,
} from "../../ast/index.mjs";
import {
  makeGetExpression,
  makeSetExpression,
  makeBinaryExpression,
} from "../../intrinsic.mjs";
import {
  makeScopeBaseWriteEffectArray,
  makeScopeBaseReadExpression,
} from "../scope/index.mjs";
import { annotateArray } from "../annotate.mjs";
import { expectSyntaxPropertyEqual } from "../report.mjs";
import { EXPRESSION_MEMO, getKeyMemoSite } from "../site.mjs";
import { visit } from "../context.mjs";

export default {
  __ANNOTATE__: annotateArray,
  MemberExpression: (node, context, site) => {
    expectSyntaxPropertyEqual(node, ["optional"], false);
    const object_memo = visit(node.object, context, {
      ...EXPRESSION_MEMO,
      info: "object",
    });
    const key_memo = visit(
      node.property,
      context,
      getKeyMemoSite(node.computed),
    );
    return concat(object_memo.setup, key_memo.setup, [
      makeExpressionEffect(
        makeSetExpression(
          context.strict,
          object_memo.pure,
          key_memo.pure,
          makeBinaryExpression(
            site.operator[0],
            makeGetExpression(object_memo.pure, key_memo.pure),
            makeLiteralExpression(1),
          ),
        ),
      ),
    ]);
  },
  Identifier: (node, context, site) =>
    makeScopeBaseWriteEffectArray(
      context,
      node.name,
      makeBinaryExpression(
        site.operator[0],
        makeScopeBaseReadExpression(context, node.name),
        makeLiteralExpression(1),
      ),
    ),
};
