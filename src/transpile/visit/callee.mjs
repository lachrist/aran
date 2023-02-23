import { partialx__x } from "../../util/index.mjs";
import { DEFAULT_CLAUSE } from "../../node.mjs";

const visitExpression = partialx__x(visit, "expression", {
  dropped: false,
  name: null,
});

const visitProperty = partialx__x(visit, "property", {});

export default {
  MemberExpression: (node, context, { kontinuation }) => {
    if (node.object.type === "Super") {
      expect1(
        !node.optional,
        SyntaxAranError,
        "super get expression should not be optional, at: %j",
        node.loc.start,
      );
      return kontinuation(
        makeApplyExpression(
          makeSpecReadExpression(context, "super.get"),
          makeLiteralExpression({undefined: null}),
          [node.computed ? visitExpression(node, context) : visitProperty(node, context)]
        ),
        makeSpecReadExpression(context, "this"),
      );
    } else {
      const variable = declareMeta(context, "callee_this");
      return kontinuation(
        makeSequenceExpression(
          makeMetaWriteEffect(
            context,
            variable,
            visitExpression(node.object, context),
          ),
          node.optional ?
            makeConditionalExpression(
              makeConditionalExpression(
                makeBinaryExpression(
                  "===",
                  makeMetaReadExpression(context, variable),
                  makeLiteralExpression(null),
                ),
                makeLiteralExpression(true),
                makeBinaryExpression(
                  "===",
                  makeMetaReadExpression(context, variable),
                  makeLiteralExpression({undefined:null}),
                ),
              ),
              makeLiteralExpression({undefined:null}),
              makeGetExpression(
                makeMetaReadExpression(context, variable),
                node.computed
                  ? visitExpression(node.property, context)
                  : visitProperty(node.property, context)
              ),
            )
            : makeGetExpression(
              makeMetaReadExpression(context, variable),
              node.computed
                ? visitExpression(node.property, context)
                : visitProperty(node.property, context)
            )
        ),
        makeMetaReadExpression(context, variable),
      );
    }
  },
  [DEFAULT_CLAUSE]: (node, context, { kontinuation }) => kontinuation(
    visit("expression", node, context, {
      dropped: false,
      name: null,
    }),
    makeLiteralExpression({undefined:null}),
  ),
};
