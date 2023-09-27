import { concat } from "array-lite";
import { reduceReverse } from "../../util/index.mjs";
import {
  makeSequenceExpression,
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
import { annotate } from "../annotate.mjs";
import { memoize } from "../memoize.mjs";
import { expectSyntaxPropertyEqual } from "../report.mjs";
import { EXPRESSION_MEMO, getKeyMemoSite } from "../site.mjs";
import { visit } from "../context.mjs";

export default {
  __ANNOTATE__: annotate,
  Identifier: (node, context, site) => {
    if (site.prefix) {
      const memo = memoize(
        context,
        "right_new",
        makeBinaryExpression(
          site.operator[0],
          makeScopeBaseReadExpression(context, node.name),
          makeLiteralExpression(1),
        ),
      );
      return reduceReverse(
        concat(
          memo.setup,
          makeScopeBaseWriteEffectArray(context, node.name, memo.pure),
        ),
        makeSequenceExpression,
        memo.pure,
      );
    } else {
      const memo = memoize(
        context,
        "right_old",
        makeScopeBaseReadExpression(context, node.name),
      );
      return reduceReverse(
        concat(
          memo.setup,
          makeScopeBaseWriteEffectArray(
            context,
            node.name,
            makeBinaryExpression(
              site.operator[0],
              memo.pure,
              makeLiteralExpression(1),
            ),
          ),
        ),
        makeSequenceExpression,
        memo.pure,
      );
    }
  },
  MemberExpression: (node, context, site) => {
    expectSyntaxPropertyEqual(node, ["optional"], false);
    if (site.prefix) {
      const object_memo = visit(node.object, context, {
        ...EXPRESSION_MEMO,
        info: "object",
      });
      const key_memo = visit(
        node.property,
        context,
        getKeyMemoSite(node.computed),
      );
      return reduceReverse(
        concat(object_memo.setup, key_memo.setup),
        makeSequenceExpression,
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
      );
    } else {
      const object_memo = visit(node.object, context, {
        ...EXPRESSION_MEMO,
        info: "object",
      });
      const key_memo = visit(
        node.property,
        context,
        getKeyMemoSite(node.computed),
      );
      const right_old_memo = memoize(
        context,
        "right_old",
        makeGetExpression(object_memo.pure, key_memo.pure),
      );
      return reduceReverse(
        concat(object_memo.setup, key_memo.setup, right_old_memo.setup, [
          makeExpressionEffect(
            makeSetExpression(
              context.strict,
              object_memo.pure,
              key_memo.pure,
              makeBinaryExpression(
                site.operator[0],
                right_old_memo.pure,
                makeLiteralExpression(1),
              ),
            ),
          ),
        ]),
        makeSequenceExpression,
        right_old_memo.pure,
      );
    }
  },
};
