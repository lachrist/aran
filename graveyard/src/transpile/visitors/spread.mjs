import { reduceReverse } from "../../util/index.mjs";
import {
  makeSequenceExpression,
  makeApplyExpression,
  makeConditionalExpression,
  makeIntrinsicExpression,
  makeLiteralExpression,
} from "../../ast/index.mjs";
import {
  makeBinaryExpression,
  makeUnaryExpression,
  makeGetExpression,
  makeArrayExpression,
  makeThrowTypeErrorExpression,
} from "../../intrinsic.mjs";
import { annotate } from "../annotate.mjs";
import { EXPRESSION, EXPRESSION_MEMO } from "../site.mjs";
import { visit } from "../context.mjs";

export default {
  __ANNOTATE__: annotate,
  SpreadElement: (node, context, _site) => {
    const memo = visit(node.argument, context, {
      ...EXPRESSION_MEMO,
      info: "spread",
    });
    // Array.from works on array-like objects
    // and spread only works on iterable.
    return reduceReverse(
      memo.setup,
      makeSequenceExpression,
      makeConditionalExpression(
        makeConditionalExpression(
          makeConditionalExpression(
            makeBinaryExpression("===", memo.pure, makeLiteralExpression(null)),
            makeLiteralExpression(true),
            makeBinaryExpression(
              "===",
              memo.pure,
              makeLiteralExpression({ undefined: null }),
            ),
          ),
          makeLiteralExpression(false),
          makeBinaryExpression(
            "===",
            makeUnaryExpression(
              "typeof",
              makeGetExpression(
                memo.pure,
                makeIntrinsicExpression("Symbol.iterator"),
              ),
            ),
            makeLiteralExpression("function"),
          ),
        ),
        makeApplyExpression(
          makeIntrinsicExpression("Array.from"),
          makeLiteralExpression({ undefined: null }),
          [memo.pure],
        ),
        makeThrowTypeErrorExpression("value is not iterable"),
      ),
    );
  },
  __DEFAULT__: (node, context, _site) =>
    makeArrayExpression([visit(node, context, EXPRESSION)]),
};
