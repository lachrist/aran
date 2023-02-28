import { concat, reduce, reduceRight, map } from "array-lite";
import {
  assert,
  partialx___,
  flipxx,
  partial_xx,
  SyntaxAranError,
} from "../../util/index.mjs";
import {
  makeSequenceExpression,
  makeApplyExpression,
  makeYieldExpression,
  makeAwaitExpression,
  makeLiteralExpression,
} from "../../ast/index.mjs";
import {
  makeGetExpression,
  makeSetExpression,
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
  makeScopeBaseMacroWriteEffect,
} from "../scope/index.mjs";
import { visit, visitMany } from "./context.mjs";

const {
  Array,
  Reflect: { apply },
  String: {
    prototype: { substring },
  },
} = globalThis;

const ANONYMOUS = { name: null };
const COOKED = { cooked: true };
const RAW = { cooked: false };

const visitCallee = partialx___(visitMany, "Callee");
const visitPattern = partialx___(visitMany, "Pattern");
const visitProperty = partialx___(visit, "Property");
const visitQuasi = partialx___(visit, "Quasi");
const visitExpression = partialx___(visit, "Expression");
const visitClosure = partialx___(visit, "Closure");
const visitClass = partialx___(visit, "Class");

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
    // Evaluation order of member assignment:
    // ======================================
    // (console.log("obj"), {
    //   __proto__: null,
    //   get foo () {
    //     console.log("get");
    //     return {
    //       __proto__: null,
    //       toString: () => {
    //         console.log("toString");
    //         return "foo";
    //       }
    //     };
    //   },
    //   set foo (value) {
    //     console.log("set", value);
    //   }
    // })[(console.log("key"), "foo")] += (console.log("val"), "bar");
    // obj
    // key
    // get
    // qux
    // toString
    // 'foobar'
    //
    // No objectify in strict mode:
    // ============================
    // > function f () { "use strict"; var foo = 1; foo.bar = 123 }
    // undefined
    // > f()
    // Thrown:
    // TypeError: Cannot create property 'bar' on number '1'
    //     at f (repl:1:52)
    AssignmentExpression: (node, context, _site) => {
      if (node.left.type === "MemberExpression") {
        if (node.operator === "=") {
          return makeSetExpression(
            context.strict,
            visitExpression(node.left.object, context, ANONYMOUS),
            visitProperty(node.left.property, context, node.left),
            visitProperty(node.right, context, ANONYMOUS),
          );
        } else {
          const object_variable = declareScopeMeta(
            context,
            "assignment_member_object",
          );
          const property_variable = declareScopeMeta(
            context,
            "assignment_member_property",
          );
          return makeSetExpression(
            context.strict,
            makeSequenceExpression(
              makeScopeMetaWriteEffect(
                context,
                object_variable,
                visitExpression(node.left.object, context, ANONYMOUS),
              ),
              makeScopeMetaReadExpression(context, object_variable),
            ),
            makeSequenceExpression(
              makeScopeMetaWriteEffect(
                context,
                property_variable,
                visitProperty(node.left.property, context, node.left),
              ),
              makeScopeMetaReadExpression(context, property_variable),
            ),
            makeBinaryExpression(
              apply(substring, node.operator, [0, node.operator.length - 1]),
              makeGetExpression(
                makeScopeMetaReadExpression(context, object_variable),
                makeScopeMetaReadExpression(context, property_variable),
              ),
              visitExpression(node.right, context, ANONYMOUS),
            ),
          );
        }
      } else if (node.left.type === "Identifier") {
        if (node.operator === "=") {
          const variable = declareScopeMeta(
            context,
            "assignment_identifier_right",
          );
          return makeSequenceExpression(
            makeScopeMetaWriteEffect(
              context,
              variable,
              visitExpression(node.right, context, node.left),
            ),
            makeSequenceExpression(
              makeScopeBaseMacroWriteEffect(
                context,
                node.left.name,
                makeScopeMetaReadExpression(context, variable),
              ),
              makeScopeMetaReadExpression(context, variable),
            ),
          );
        } else {
          const variable = declareScopeMeta(
            context,
            "assignment_identifier_right",
          );
          return makeSequenceExpression(
            makeScopeMetaWriteEffect(
              context,
              variable,
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
            makeSequenceExpression(
              makeScopeBaseMacroWriteEffect(
                context,
                node.left.name,
                makeScopeMetaReadExpression(context, variable),
              ),
              makeScopeMetaReadExpression(context, variable),
            ),
          );
        }
      } else {
        assert(
          node.operator === "=",
          SyntaxAranError,
          "unexpected assignment operator with patterns at %j",
          node.loc.start,
        );
        const variable = declareScopeMeta(context, "assignment_pattern_right");
        return makeSequenceExpression(
          makeScopeMetaWriteEffect(
            context,
            variable,
            visitExpression(node.right, context, ANONYMOUS),
          ),
          reduceRight(
            visitPattern(node.left, context, {
              kind: null,
              right: makeScopeMetaReadExpression(context, variable),
            }),
            flipxx(makeSequenceExpression),
            makeScopeMetaReadExpression(context, variable),
          ),
        );
      }
    },
  },
};
