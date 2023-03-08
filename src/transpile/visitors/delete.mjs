import { reduceReverse } from "../../util/index.mjs";
import {
  makeConditionalExpression,
  makeLiteralExpression,
  makeSequenceExpression,
} from "../../ast/index.mjs";
import {
  makeBinaryExpression,
  makeDeleteExpression,
} from "../../intrinsic.mjs";
import { makeScopeBaseDiscardExpression } from "../scope/index.mjs";
import { annotate } from "../annotate.mjs";
import {
  DELETE,
  EFFECT,
  EXPRESSION,
  EXPRESSION_MEMO,
  getKeySite,
} from "../site.mjs";
import { visit } from "../context.mjs";

export default {
  __ANNOTATE__: annotate,
  // TODO: figure out how to make babel parse `delete x` in strict mode.
  /* c8 ignore start */
  Identifier: (node, context, _site) =>
    makeScopeBaseDiscardExpression(context, node.name),
  /* c8 ignore stop */
  ChainExpression: (node, context, _site) =>
    visit(node.expression, context, DELETE),
  MemberExpression: (node, context, _site) => {
    if (node.optional) {
      const memo = visit(node.object, context, {
        ...EXPRESSION_MEMO,
        info: "optional_object",
      });
      return reduceReverse(
        memo.setup,
        makeSequenceExpression,
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
          makeLiteralExpression(true),
          makeDeleteExpression(
            context.strict,
            memo.pure,
            visit(node.property, context, getKeySite(node.computed)),
          ),
        ),
      );
    } else {
      return makeDeleteExpression(
        context.strict,
        visit(node.object, context, EXPRESSION),
        visit(node.property, context, getKeySite(node.computed)),
      );
    }
  },
  __DEFAULT__: (node, context, _site) =>
    reduceReverse(
      visit(node, context, EFFECT),
      makeSequenceExpression,
      makeLiteralExpression(true),
    ),
};
