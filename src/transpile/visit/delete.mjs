import { reduceReverse } from "../../util/index.mjs";
import { DEFAULT_CLAUSE } from "../../node.mjs";
import {
  annotateNode,
  makeConditionalExpression,
  makeLiteralExpression,
  makeSequenceExpression,
} from "../../ast/index.mjs";
import {
  makeBinaryExpression,
  makeDeleteExpression,
} from "../../intrinsic.mjs";
import {
  makeScopeBaseDiscardExpression,
  declareScopeMeta,
  makeScopeMetaWriteEffectArray,
  makeScopeMetaReadExpression,
} from "../scope/index.mjs";
import { visit, DELETE, EFFECT, EXPRESSION, KEY_MAP } from "./context.mjs";

export default {
  __ANNOTATE__: annotateNode,
  // TODO: figure out how to make babel parse `delete x` in strict mode.
  /* c8 ignore start */
  Identifier: (node, context, _site) =>
    makeScopeBaseDiscardExpression(context, node.name),
  /* c8 ignore stop */
  ChainExpression: (node, context, _site) =>
    visit(node.expression, context, DELETE),
  MemberExpression: (node, context, _site) => {
    if (node.optional) {
      const variable = declareScopeMeta(context, "DeleteMemberExpression");
      return reduceReverse(
        makeScopeMetaWriteEffectArray(
          context,
          variable,
          visit(node.object, context, EXPRESSION),
        ),
        makeSequenceExpression,
        makeConditionalExpression(
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
          makeLiteralExpression(true),
          makeDeleteExpression(
            context.strict,
            makeScopeMetaReadExpression(context, variable),
            visit(node.property, context, KEY_MAP[node.computed]),
          ),
        ),
      );
    } else {
      return makeDeleteExpression(
        context.strict,
        visit(node.object, context, EXPRESSION),
        visit(node.property, context, KEY_MAP[node.computed]),
      );
    }
  },
  [DEFAULT_CLAUSE]: (node, context, _site) =>
    reduceReverse(
      visit(node, context, EFFECT),
      makeSequenceExpression,
      makeLiteralExpression(true),
    ),
};
