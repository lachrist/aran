import { partialx__x } from "../../util/index.mjs";
import { DEFAULT_CLAUSE } from "../../node.mjs";

const visitExpression = partialx__x(visit, "expression", {
  dropped: false,
  name: null,
});

const visitProperty = partialx__x(visit, "property", {});

export default {
  MemberExpression: (node, context, _site) => {
    if (node.object.type === "Super") {
      expect1(
        !node.optional,
        SyntaxAranError,
        "illegal optional super get expression at: %j",
        node.loc.start,
      );
      return [
        makeApplyExpression(
          makeSpecReadExpression(context, "super.get"),
          makeLiteralExpression({undefined: null}),
          [node.computed ? visitExpression(node, context) : visitProperty(node, context)]
        ),
        makeSpecReadExpression(context, "this"),
      ];
    } else {
      const variable = declareMeta(context, "callee_this");
      return [
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
      ];
    }
  },
  [DEFAULT_CLAUSE]: (node, context, _site) => [
    visit("expression", node, context, {
      dropped: false,
      name: null,
    }),
    makeLiteralExpression({undefined:null}),
  ],
};
