import { concat, reduce, map, reduceRight, flatMap, slice } from "array-lite";
import {
  flipxx,
  partialx___,
  partial_xx,
  SyntaxAranError,
} from "../../util/index.mjs";
import {
  makeConditionalExpression,
  makeSequenceExpression,
  makeApplyExpression,
  makeYieldExpression,
  makeAwaitExpression,
  makeLiteralExpression,
} from "../../ast/index.mjs";
import {
  makeArrayExpression,
  makeObjectFreezeExpression,
  makeObjectDefinePropertyExpression,
  makeDataDescriptorExpression,
  makeBinaryExpression,
} from "../../intrinsic.mjs";
import {
  declareScopeMeta,
  makeScopeMetaWriteEffect,
  makeScopeMetaReadExpression,
  makeScopeBaseReadExpression,
  makeScopeSpecReadExpression,
} from "../scope/index.mjs";
import { expectSyntaxNotEqualDeep, makeSyntaxError } from "./report.mjs";
import { visit, visitMany } from "./context.mjs";

const { Array } = globalThis;

const ANONYMOUS = { name: null };
const COOKED = { cooked: true };
const RAW = { cooked: false };

const visitEffect = partialx___(visitMany, "Effect");
const visitCallee = partialx___(visitMany, "Callee");
const visitQuasi = partialx___(visit, "Quasi");
const visitExpression = partialx___(visit, "Expression");
const visitClosure = partialx___(visit, "Closure");
const visitClass = partialx___(visit, "Class");
const visitUpdateExpression = partialx___(visit, "UpdateExpression");
const visitAssignmentExpression = partialx___(visit, "AssignmentExpression");

const getMetaPropertyVariable = (node) => {
  if (node.meta.name === "new" && node.property.name === "target") {
    return "new.target";
  } else if (node.meta.name === "import" && node.property.name === "meta") {
    return "import.meta";
  } /* c8 ignore start */ else {
    throw new SyntaxAranError("invalid meta property");
  } /* c8 ignore stop */
};

export default {
  Expression: {
    // Producer //
    Literal: (node, _context, _site) => makeLiteralExpression(node.value),
    Identifier: (node, context, _site) =>
      makeScopeBaseReadExpression(context, node.name),
    ThisExpression: (_node, context, _site) =>
      makeScopeSpecReadExpression(context, "this"),
    MetaProperty: (node, context, _site) =>
      makeScopeSpecReadExpression(context, getMetaPropertyVariable(node)),
    ArrowFunctionExpression: (node, context, site) =>
      visitClosure(node, context, { kind: "arrow", ...site }),
    FunctionExpression: (node, context, site) =>
      visitClosure(node, context, { kind: "function", ...site }),
    ClassExpression: (node, context, site) => visitClass(node, context, site),
    // Combinators //
    TemplateLiteral: (node, context, _site) =>
      node.expressions.length === 0
        ? visitQuasi(node.quasis[0], context, COOKED)
        : makeBinaryExpression(
            "+",
            reduce(
              Array(node.expressions.length - 1),
              (expression, _, index) =>
                makeBinaryExpression(
                  "+",
                  expression,
                  makeBinaryExpression(
                    "+",
                    visitQuasi(node.quasis[index + 1], context, COOKED),
                    visitExpression(
                      node.expressions[index + 1],
                      context,
                      ANONYMOUS,
                    ),
                  ),
                ),
              makeBinaryExpression(
                "+",
                visitQuasi(node.quasis[0], context, COOKED),
                visitExpression(node.expressions[0], context, ANONYMOUS),
              ),
            ),
            visitQuasi(node.quasis[node.quasis.length - 1], context, COOKED),
          ),
    // Tagged template cannot lead to a direct eval call because it receives an array instead of a string:
    // cf: https://www.ecma-international.org/ecma-262/10.0/index.html#sec-performeval
    TaggedTemplateExpression: (node, context, _site) => {
      const [closure_expression, this_expression] = visitCallee(
        node.tag,
        context,
        null,
      );
      return makeApplyExpression(
        closure_expression,
        this_expression,
        concat(
          [
            makeObjectFreezeExpression(
              makeObjectDefinePropertyExpression(
                makeArrayExpression(
                  map(
                    node.quasi.quasis,
                    partial_xx(visitQuasi, context, COOKED),
                  ),
                ),
                makeLiteralExpression("raw"),
                makeDataDescriptorExpression(
                  makeObjectFreezeExpression(
                    makeArrayExpression(
                      map(
                        node.quasi.quasis,
                        partial_xx(visitQuasi, context, RAW),
                      ),
                    ),
                  ),
                  makeLiteralExpression(false),
                  makeLiteralExpression(false),
                  makeLiteralExpression(false),
                ),
              ),
            ),
          ],
          map(
            node.quasi.expressions,
            partial_xx(visitExpression, context, ANONYMOUS),
          ),
        ),
      );
    },
    AwaitExpression: (node, context, _site) =>
      makeAwaitExpression(visitExpression(node.argument, context, ANONYMOUS)),
    YieldExpression: (node, context, _site) =>
      makeYieldExpression(
        node.delegate,
        node.argument === null
          ? makeLiteralExpression({ undefined: null })
          : visitExpression(node.argument, context, ANONYMOUS),
      ),
    AssignmentExpression: (node, context, _site) =>
      visitAssignmentExpression(node.left, context, node),
    UpdateExpression: (node, context, _site) =>
      visitUpdateExpression(node.argument, context, node),
    /////////////
    // Control //
    /////////////
    // Function's name are not propagated through sequences:
    //
    // > var o = {x:(123, function () {})}
    // undefined
    // > o
    // { x: [Function] }
    // > o.x.name
    // ''
    SequenceExpression: (node, context, _site) => {
      expectSyntaxNotEqualDeep(node, "expressions", "length", 0);
      return reduceRight(
        flatMap(
          slice(node.expressions, 0, node.expressions.length - 1),
          partial_xx(visitEffect, context, null),
        ),
        flipxx(makeSequenceExpression),
        visitExpression(
          node.expressions[node.expressions.length - 1],
          context,
          ANONYMOUS,
        ),
      );
    },
    LogicalExpression: (node, context, _site) => {
      const variable = declareScopeMeta(
        context,
        "ExpressionLogicalExpressionLeft",
      );
      if (node.operator === "&&") {
        return makeSequenceExpression(
          makeScopeMetaWriteEffect(
            context,
            variable,
            visitExpression(node.left, context, null),
          ),
          makeConditionalExpression(
            makeScopeMetaReadExpression(context, variable),
            visitExpression(node.right, context, null),
            makeScopeMetaReadExpression(context, variable),
          ),
        );
      } else if (node.operator === "||") {
        return makeSequenceExpression(
          makeScopeMetaWriteEffect(
            context,
            variable,
            visitExpression(node.left, context, null),
          ),
          makeConditionalExpression(
            makeScopeMetaReadExpression(context, variable),
            makeScopeMetaReadExpression(context, variable),
            visitExpression(node.right, context, null),
          ),
        );
      } else if (node.operator === "??") {
        return makeSequenceExpression(
          makeScopeMetaWriteEffect(
            context,
            variable,
            visitExpression(node.left, context, null),
          ),
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
            visitExpression(node.right, context, null),
            makeScopeMetaReadExpression(context, variable),
          ),
        );
      } /* c8 ignore start */ else {
        throw makeSyntaxError(node, "operator");
      } /* c8 ignore stop */
    },
  },
};
