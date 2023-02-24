import {
  partialx__x,
  partialx___,
  expect1,
  SyntaxAranError,
} from "../../util/index.mjs";
import { DEFAULT_CLAUSE } from "../../node.mjs";
import {
  makeApplyExpression,
  makeLiteralExpression,
  makeSequenceExpression,
  makeConditionalExpression,
} from "../../ast/index.mjs";
import { makeGetExpression, makeBinaryExpression } from "../../intrinsic.mjs";
import {
  makeScopeMetaReadExpression,
  makeScopeMetaWriteEffect,
  makeScopeSpecReadExpression,
  declareScopeMeta,
} from "../scope/index.mjs";
import { visit, visitMany } from "./context.mjs";

const visitExpression = partialx__x(visit, "expression", {
  dropped: false,
  name: null,
});

const visitProperty = partialx___(visit, "property");

export default {
  ChainExpression: (node, context, site) =>
    visitMany("callee", node.expression, context, site),
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
          makeScopeSpecReadExpression(context, "super.get"),
          makeLiteralExpression({ undefined: null }),
          [visitProperty(node.property, context, node)],
        ),
        makeScopeSpecReadExpression(context, "this"),
      ];
    } else {
      const variable = declareScopeMeta(context, "callee_this");
      return [
        makeSequenceExpression(
          makeScopeMetaWriteEffect(
            context,
            variable,
            visitExpression(node.object, context),
          ),
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
                  visitProperty(node.property, context, node),
                ),
              )
            : makeGetExpression(
                makeScopeMetaReadExpression(context, variable),
                visitProperty(node.property, context, node),
              ),
        ),
        makeScopeMetaReadExpression(context, variable),
      ];
    }
  },
  [DEFAULT_CLAUSE]: (node, context, _site) => [
    visitExpression(node, context),
    makeLiteralExpression({ undefined: null }),
  ],
};
