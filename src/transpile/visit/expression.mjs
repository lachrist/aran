import { concat, reduce, map } from "array-lite";
import { partialx___, partial_xx, SyntaxAranError } from "../../util/index.mjs";
import {
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
  makeScopeBaseReadExpression,
  makeScopeSpecReadExpression,
} from "../scope/index.mjs";
import { visit, visitMany } from "./context.mjs";

const { Array } = globalThis;

const ANONYMOUS = { name: null };
const COOKED = { cooked: true };
const RAW = { cooked: false };

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
  },
};
