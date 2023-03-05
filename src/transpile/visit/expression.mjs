import { concat, reduce, map, flatMap, slice } from "array-lite";
import {
  reduceReverse,
  partial_xx,
  SyntaxAranError,
} from "../../util/index.mjs";
import {
  annotateNode,
  makeConditionalExpression,
  makeSequenceExpression,
  makeApplyExpression,
  makeYieldExpression,
  makeAwaitExpression,
  makeLiteralExpression,
} from "../../ast/index.mjs";
import {
  makeUnaryExpression,
  makeArrayExpression,
  makeObjectFreezeExpression,
  makeObjectDefinePropertyExpression,
  makeDataDescriptorExpression,
  makeBinaryExpression,
} from "../../intrinsic.mjs";
import {
  declareScopeMeta,
  makeScopeMetaWriteEffectArray,
  makeScopeMetaReadExpression,
  makeScopeBaseReadExpression,
  makeScopeSpecReadExpression,
} from "../scope/index.mjs";
import { expectSyntaxNotEqualDeep, makeSyntaxError } from "./report.mjs";
import { visit } from "./context.mjs";

const { Array } = globalThis;

const QUASI_COOKED = { type: "Quasi", cooked: true };
const QUASI_RAW = { type: "Quasi", cooked: false };
const EXPRESSION = { type: "Expression", name: "" };
const EFFECT = { type: "Effect" };
const DELETE = { type: "Delete" };
const CALLEE = { type: "Callee" };

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
    __ANNOTATE__: annotateNode,
    // Producer //
    Literal: (node, _context, _site) => makeLiteralExpression(node.value),
    Identifier: (node, context, _site) =>
      makeScopeBaseReadExpression(context, node.name),
    ThisExpression: (_node, context, _site) =>
      makeScopeSpecReadExpression(context, "this"),
    MetaProperty: (node, context, _site) =>
      makeScopeSpecReadExpression(context, getMetaPropertyVariable(node)),
    ArrowFunctionExpression: (node, context, site) =>
      visit(node, context, {
        type: "Closure",
        kind: "arrow",
        name: makeLiteralExpression(site.name),
        super: null,
      }),
    FunctionExpression: (node, context, site) =>
      visit(node, context, {
        type: "Closure",
        kind: "function",
        name: makeLiteralExpression(
          node.id === null ? site.name : node.id.name,
        ),
        super: null,
      }),
    ClassExpression: (node, context, site) =>
      visit(node, context, {
        type: "Class",
        name: node.id === null ? site.name : node.id.name,
      }),
    // Combinators //
    TemplateLiteral: (node, context, _site) =>
      node.expressions.length === 0
        ? visit(node.quasis[0], context, QUASI_COOKED)
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
                    visit(node.quasis[index + 1], context, QUASI_COOKED),
                    visit(node.expressions[index + 1], context, EXPRESSION),
                  ),
                ),
              makeBinaryExpression(
                "+",
                visit(node.quasis[0], context, QUASI_COOKED),
                visit(node.expressions[0], context, EXPRESSION),
              ),
            ),
            visit(node.quasis[node.quasis.length - 1], context, QUASI_COOKED),
          ),
    // Tagged template cannot lead to a direct eval call because it receives an array instead of a string:
    // cf: https://www.ecma-international.org/ecma-262/10.0/index.html#sec-performeval
    TaggedTemplateExpression: (node, context, _site) => {
      const { callee: callee_expression, this: this_expression } = visit(
        node.tag,
        context,
        CALLEE,
      );
      return makeApplyExpression(
        callee_expression,
        this_expression,
        concat(
          [
            makeObjectFreezeExpression(
              makeObjectDefinePropertyExpression(
                makeArrayExpression(
                  map(
                    node.quasi.quasis,
                    partial_xx(visit, context, QUASI_COOKED),
                  ),
                ),
                makeLiteralExpression("raw"),
                makeDataDescriptorExpression(
                  makeObjectFreezeExpression(
                    makeArrayExpression(
                      map(
                        node.quasi.quasis,
                        partial_xx(visit, context, QUASI_RAW),
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
          map(node.quasi.expressions, partial_xx(visit, context, EXPRESSION)),
        ),
      );
    },
    AwaitExpression: (node, context, _site) =>
      makeAwaitExpression(visit(node.argument, context, EXPRESSION)),
    YieldExpression: (node, context, _site) =>
      makeYieldExpression(
        node.delegate,
        node.argument === null
          ? makeLiteralExpression({ undefined: null })
          : visit(node.argument, context, EXPRESSION),
      ),
    AssignmentExpression: (node, context, _site) =>
      visit(node.left, context, {
        type: "AssignmentExpression",
        operator: node.operator,
        right: node.right,
      }),
    UpdateExpression: (node, context, _site) =>
      visit(node.argument, context, {
        type: "UpdateExpression",
        operator: node.operator,
        prefix: node.prefix,
        right: node.right,
      }),
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
      return reduceReverse(
        flatMap(
          slice(node.expressions, 0, node.expressions.length - 1),
          partial_xx(visit, context, EFFECT),
        ),
        makeSequenceExpression,
        visit(
          node.expressions[node.expressions.length - 1],
          context,
          EXPRESSION,
        ),
      );
    },
    ConditionalExpression: (node, context, _site) =>
      makeConditionalExpression(
        visit(node.test, context, EXPRESSION),
        visit(node.consequent, context, EXPRESSION),
        visit(node.alternate, context, EXPRESSION),
      ),
    LogicalExpression: (node, context, _site) => {
      const variable = declareScopeMeta(
        context,
        "ExpressionLogicalExpressionLeft",
      );
      if (node.operator === "&&") {
        return reduceReverse(
          makeScopeMetaWriteEffectArray(
            context,
            variable,
            visit(node.left, context, EXPRESSION),
          ),
          makeSequenceExpression,
          makeConditionalExpression(
            makeScopeMetaReadExpression(context, variable),
            visit(node.right, context, EXPRESSION),
            makeScopeMetaReadExpression(context, variable),
          ),
        );
      } else if (node.operator === "||") {
        return reduceReverse(
          makeScopeMetaWriteEffectArray(
            context,
            variable,
            visit(node.left, context, EXPRESSION),
          ),
          makeSequenceExpression,
          makeConditionalExpression(
            makeScopeMetaReadExpression(context, variable),
            makeScopeMetaReadExpression(context, variable),
            visit(node.right, context, EXPRESSION),
          ),
        );
      } else if (node.operator === "??") {
        return reduceReverse(
          makeScopeMetaWriteEffectArray(
            context,
            variable,
            visit(node.left, context, EXPRESSION),
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
            visit(node.right, context, EXPRESSION),
            makeScopeMetaReadExpression(context, variable),
          ),
        );
      } /* c8 ignore start */ else {
        throw makeSyntaxError(node, "operator");
      } /* c8 ignore stop */
    },
    // Operation //
    UnaryExpression: (node, context, _site) => {
      if (node.operator === "delete") {
        return visit(node.argument, context, DELETE);
      } else if (node.operator === "void") {
        return reduceReverse(
          visit(node.argument, context, EFFECT),
          makeSequenceExpression,
          makeLiteralExpression({ undefined: null }),
        );
      } else {
        return makeUnaryExpression(
          node.operator,
          visit(node.argument, context, EXPRESSION),
        );
      }
    },
    ImportExpression: (node, context, _site) =>
      makeApplyExpression(
        makeScopeSpecReadExpression(context, "import"),
        makeLiteralExpression({ undefined: null }),
        [visit(node.source, context, EXPRESSION)],
      ),
  },
};
