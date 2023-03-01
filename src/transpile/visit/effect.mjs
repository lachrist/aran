import { partialx___ } from "../../util/index.mjs";
import { DEFAULT_CLAUSE } from "../../node.mjs";
import {
  makeLiteralExpression,
  makeExpressionEffect,
} from "../../ast/index.mjs";
import {
  makeSetExpression,
  makeGetExpression,
  makeBinaryExpression,
} from "../../intrinsic.mjs";
import {
  makeScopeMetaWriteEffect,
  makeScopeMetaReadExpression,
  makeScopeBaseWriteEffect,
  makeScopeBaseReadExpression,
  declareScopeMeta,
} from "../scope/index.mjs";
import { expectSyntaxValue, makeTypeSyntaxError } from "./report.mjs";
import { visit, visitMany } from "./context.mjs";

const {
  Reflect: { apply },
  String: {
    prototype: { substring },
  },
} = globalThis;

const ANONYMOUS = { name: null };

const visitExpression = partialx___(visit, "Expression");
const visitPattern = partialx___(visitMany, "Pattern");
const visitProperty = partialx___(visit, "Property");

export default {
  Effect: {
    AssignmentExpression: (node, context, _site) => {
      if (node.left.type === "MemberExpression") {
        return [
          makeExpressionEffect(visitExpression(node, context, ANONYMOUS)),
        ];
      } else if (node.left.type === "Identifier") {
        if (node.operator === "=") {
          return [
            makeScopeBaseWriteEffect(
              context,
              node.left.name,
              visitExpression(node.right, context, node.left),
            ),
          ];
        } else {
          return [
            makeScopeBaseWriteEffect(
              context,
              node.left.name,
              makeBinaryExpression(
                apply(substring, node.operator, [0, node.operator.length - 1]),
                makeScopeBaseReadExpression(context, node.left.name),
                // Name are not transmitted on update:
                //
                // > var f = "foo"
                // undefined
                // > f += function () {}
                // 'foofunction () {}'
                visitExpression(node.right, context, ANONYMOUS),
              ),
            ),
          ];
        }
      } else {
        expectSyntaxValue(node, "operator", "=");
        return visitPattern(node.left, context, {
          kind: null,
          right: visitExpression(node.right, context, ANONYMOUS),
        });
      }
    },
    [DEFAULT_CLAUSE]: (node, context, _site) => [
      makeExpressionEffect(visitExpression(node, context, ANONYMOUS)),
    ],
  },
};
