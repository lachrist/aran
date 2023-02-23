import { reduce } from "array-lite";
import { partialx__x, SyntaxAranError } from "../../util/index.mjs";
import {
  makeYieldExpression,
  makeAwaitExpression,
  makeLiteralExpression,
} from "../../ast/index.mjs";
import { makeBinaryExpression } from "../../intrinsic.mjs";
import {
  makeBaseReadExpression,
  makeSpecReadExpression,
} from "../scope/index.mjs";
import { visit } from "./context.mjs";

const { Array } = globalThis;

const visitProperty = partialx__x(visit, "property", null);

const visitQuasi = partialx__x(visit, "quasi", null);

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

const visitCallee = (node, context, site) => {
  assert(node.type === "MemberExpression", "expected MemberExpression");

};

export default {
  // Producer //
  Literal: (node, _context, _site) => makeLiteralExpression(node.value),
  Identifier: (node, context, _site) =>
    makeBaseReadExpression(context, node.name),
  ThisExpression: (_node, context, _site) =>
    makeSpecReadExpression(context, "this"),
  MetaProperty: (node, context, _site) =>
    makeSpecReadExpression(
      context,
      getMetaPropertyVariable(node),
    ),
  ArrowFunctionExpression: (node, context, site) =>
    visit("closure", node, context, { kind: "arrow", ...site }),
  FunctionExpression: (node, context, site) =>
    visit("closure", node, context, { kind: "function", ...site }),
  ClassExpression: (node, context, site) => visit("class", node, context, site),
  // Combinators //
  TemplateLiteral: (node, context, _site) =>
    node.expressions.length === 0
      ? visitQuasi(node.quasis[0], context)
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
                  visitQuasi(node.quasis[index + 1], context),
                  visitExpression(node.expressions[index + 1], context),
                ),
              ),
            makeBinaryExpression(
              "+",
              visitQuasi(node.quasis[0], context),
              visitExpression(node.expressions[0], context),
            ),
          ),
          visitQuasi(node.quasis[node.quasis.length - 1], context),
        ),

    // Tagged template cannot lead to a direct eval call because it receives an array instead of a string:
    // cf: https://www.ecma-international.org/ecma-262/10.0/index.html#sec-performeval
    visitors.TaggedTemplateExpression = (scope, node, context) => (
      (
        (closure) => (
          // We do not need to check for node.tag.type === "ChainExpression" because:
          // require("acorn").parse("(123)?.[456]`foo`;")
          // SyntaxError: Optional chaining cannot appear in the tag of tagged template expressions (1:12)
          node.tag.type === "MemberExpression" ?
          Visit.visitMember(
            scope,
            node.tag,
            {
              kontinuation: (expression1, expression2) => Tree.ApplyExpression(
                expression1,
                expression2,
                closure())}) :
          Tree.ApplyExpression(
            Visit.visitExpression(scope, node.tag, null),
            Tree.PrimitiveExpression(void 0),
            closure())))
      (
        () => ArrayLite.concat(
          [
            Intrinsic.makeFreezeExpression(
              Intrinsic.makeDefinePropertyExpression(
                Intrinsic.makeArrayExpression(
                  ArrayLite.map(
                    node.quasi.quasis,
                    (quasi) => Tree.PrimitiveExpression(quasi.value.cooked))),
                Tree.PrimitiveExpression("raw"),
                {
                  __proto__: null,
                  value: Intrinsic.makeFreezeExpression(
                    Intrinsic.makeArrayExpression(
                      ArrayLite.map(
                        node.quasi.quasis,
                        (quasi) => Tree.PrimitiveExpression(quasi.value.raw))),
                    true,
                    Intrinsic.TARGET_RESULT)},
                true,
                Intrinsic.TARGET_RESULT),
              true,
              Intrinsic.TARGET_RESULT)],
          ArrayLite.map(
            node.quasi.expressions,
            (expression) => Visit.visitExpression(scope, expression, null)))));



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
