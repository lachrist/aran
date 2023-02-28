import { assert, SyntaxAranError, partialx___ } from "../../util/index.mjs";
import { DEFAULT_CLAUSE } from "../../node.mjs";
import { makeExpressionEffect } from "../../ast/index.mjs";
import { makeBinaryExpression } from "../../intrinsic.mjs";
import {
  makeScopeBaseWriteEffect,
  makeScopeBaseReadExpression,
} from "../scope/index.mjs";
import { visit, visitMany } from "./context.mjs";

const {
  Reflect: { apply },
  String: {
    prototype: { substring },
  },
} = globalThis;

const visitExpression = partialx___(visit, "Expression");

const visitPattern = partialx___(visitMany, "Pattern");

const ANONYMOUS = { name: null };

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
        assert(
          node.operator === "=",
          SyntaxAranError,
          "unexpected assignment operator with patterns at %j",
          node.loc.start,
        );
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
