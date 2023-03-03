import { reduceReverse, partialx___ } from "../../util/index.mjs";
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
  makeScopeMetaWriteEffectArray,
  makeScopeSpecReadExpression,
  declareScopeMeta,
} from "../scope/index.mjs";
import { expectSyntaxEqual } from "./report.mjs";
import { visit, visitMany } from "./context.mjs";

const ANONYMOUS = { name: null };

const visitExpression = partialx___(visit, "Expression");

const visitKey = partialx___(visit, "Key");

export default {
  Callee: {
    ChainExpression: (node, context, site) =>
      visitMany("Callee", node.expression, context, site),
    MemberExpression: (node, context, _site) => {
      if (node.object.type === "Super") {
        expectSyntaxEqual(node, "optional", false);
        return [
          makeApplyExpression(
            makeScopeSpecReadExpression(context, "super.get"),
            makeLiteralExpression({ undefined: null }),
            [visitKey(node.property, context, node)],
          ),
          makeScopeSpecReadExpression(context, "this"),
        ];
      } else {
        const variable = declareScopeMeta(context, "callee_this");
        return [
          reduceReverse(
            makeScopeMetaWriteEffectArray(
              context,
              variable,
              visitExpression(node.object, context, ANONYMOUS),
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
                    visitKey(node.property, context, node),
                  ),
                )
              : makeGetExpression(
                  makeScopeMetaReadExpression(context, variable),
                  visitKey(node.property, context, node),
                ),
          ),
          makeScopeMetaReadExpression(context, variable),
        ];
      }
    },
    [DEFAULT_CLAUSE]: (node, context, _site) => [
      visitExpression(node, context, ANONYMOUS),
      makeLiteralExpression({ undefined: null }),
    ],
  },
};
