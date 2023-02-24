import { concat, reduce, map } from "array-lite";
import { partial_x, partialx__x, SyntaxAranError } from "../../util/index.mjs";
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

const visitCallee = partialx__x(visitMany, "callee", null);

// const visitProperty = partialx__x(visit, "property", null);

const visitQuasiCooked = partialx__x(visit, "quasi", { cooked: true });

const visitQuasiRaw = partialx__x(visit, "quasi", { cooked: false });

const visitExpression = partialx__x(visit, "expression", {
  dropped: false,
  name: null,
});

// const visitDroppedExpression = partialx__x(visit, "expression", {
//   dropped: true,
//   name: null,
// });

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
  // Producer //
  Literal: (node, _context, _site) => makeLiteralExpression(node.value),
  Identifier: (node, context, _site) =>
    makeScopeBaseReadExpression(context, node.name),
  ThisExpression: (_node, context, _site) =>
    makeScopeSpecReadExpression(context, "this"),
  MetaProperty: (node, context, _site) =>
    makeScopeSpecReadExpression(context, getMetaPropertyVariable(node)),
  ArrowFunctionExpression: (node, context, site) =>
    visit("closure", node, context, { kind: "arrow", ...site }),
  FunctionExpression: (node, context, site) =>
    visit("closure", node, context, { kind: "function", ...site }),
  ClassExpression: (node, context, site) => visit("class", node, context, site),
  // Combinators //
  TemplateLiteral: (node, context, _site) =>
    node.expressions.length === 0
      ? visitQuasiCooked(node.quasis[0], context)
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
                  visitQuasiCooked(node.quasis[index + 1], context),
                  visitExpression(node.expressions[index + 1], context),
                ),
              ),
            makeBinaryExpression(
              "+",
              visitQuasiCooked(node.quasis[0], context),
              visitExpression(node.expressions[0], context),
            ),
          ),
          visitQuasiCooked(node.quasis[node.quasis.length - 1], context),
        ),
  // Tagged template cannot lead to a direct eval call because it receives an array instead of a string:
  // cf: https://www.ecma-international.org/ecma-262/10.0/index.html#sec-performeval
  TaggedTemplateExpression: (node, context, _site) => {
    const [closure_expression, this_expression] = visitCallee(
      node.tag,
      context,
    );
    return makeApplyExpression(
      closure_expression,
      this_expression,
      concat(
        [
          makeObjectFreezeExpression(
            makeObjectDefinePropertyExpression(
              makeArrayExpression(
                map(node.quasi.quasis, partial_x(visitQuasiCooked, context)),
              ),
              makeLiteralExpression("raw"),
              makeDataDescriptorExpression(
                makeObjectFreezeExpression(
                  makeArrayExpression(
                    map(node.quasi.quasis, partial_x(visitQuasiRaw, context)),
                  ),
                ),
                makeLiteralExpression(false),
                makeLiteralExpression(false),
                makeLiteralExpression(false),
              ),
            ),
          ),
        ],
        map(node.quasi.expressions, partial_x(visitExpression, context)),
      ),
    );
  },
  AwaitExpression: (node, context, _site) =>
    makeAwaitExpression(visitExpression(node.argument, context)),
  YieldExpression: (node, context, _site) =>
    makeYieldExpression(
      node.delegate,
      node.argument === null
        ? makeLiteralExpression({ undefined: null })
        : visitExpression(node.argument, context),
    ),
};
