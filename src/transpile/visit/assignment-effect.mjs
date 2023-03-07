import { concat } from "array-lite";
import {
  makeLiteralExpression,
  makeExpressionEffect,
} from "../../ast/index.mjs";
import {
  makeGetExpression,
  makeSetExpression,
  makeBinaryExpression,
} from "../../intrinsic.mjs";
import {
  declareScopeMeta,
  makeScopeMetaWriteEffectArray,
  makeScopeMetaReadExpression,
  makeScopeBaseWriteEffectArray,
  makeScopeBaseReadExpression,
} from "../scope/index.mjs";
import { expectSyntaxPropertyEqual } from "./report.mjs";
import {
  annotateNodeArray,
  visit,
  EXPRESSION,
  PATTERN,
  getKeySite,
} from "./context.mjs";

const {
  Reflect: { apply },
  String: {
    prototype: { substring },
  },
} = globalThis;

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

export default {
  __ANNOTATE__: annotateNodeArray,
  Identifier: (node, context, site) => {
    if (site.operator === "=") {
      return makeScopeBaseWriteEffectArray(
        context,
        node.name,
        visit(site.right, context, {
          ...EXPRESSION,
          name: makeLiteralExpression(node.name),
        }),
      );
    } else {
      return makeScopeBaseWriteEffectArray(
        context,
        node.name,
        makeBinaryExpression(
          apply(substring, site.operator, [0, site.operator.length - 1]),
          makeScopeBaseReadExpression(context, node.name),
          // Name are not transmitted on update:
          //
          // > var f = "foo"
          // undefined
          // > f += function () {}
          // 'foofunction () {}'
          visit(site.right, context, EXPRESSION),
        ),
      );
    }
  },
  MemberExpression: (node, context, site) => {
    expectSyntaxPropertyEqual(node, ["optional"], false);
    if (site.operator === "=") {
      return [
        makeExpressionEffect(
          makeSetExpression(
            context.strict,
            visit(node.object, context, EXPRESSION),
            visit(node.property, context, getKeySite(node.computed)),
            visit(site.right, context, EXPRESSION),
          ),
        ),
      ];
    } else {
      const object_variable = declareScopeMeta(
        context,
        "AssignmentEffectMemberExpressionObject",
      );
      const property_variable = declareScopeMeta(
        context,
        "AssignmentEffectMemberExpressionKey",
      );
      return concat(
        makeScopeMetaWriteEffectArray(
          context,
          object_variable,
          visit(node.object, context, EXPRESSION),
        ),
        makeScopeMetaWriteEffectArray(
          context,
          property_variable,
          visit(node.property, context, getKeySite(node.computed)),
        ),
        [
          makeExpressionEffect(
            makeSetExpression(
              context.strict,
              makeScopeMetaReadExpression(context, object_variable),
              makeScopeMetaReadExpression(context, property_variable),
              makeBinaryExpression(
                apply(substring, site.operator, [0, site.operator.length - 1]),
                makeGetExpression(
                  makeScopeMetaReadExpression(context, object_variable),
                  makeScopeMetaReadExpression(context, property_variable),
                ),
                visit(site.right, context, EXPRESSION),
              ),
            ),
          ),
        ],
      );
    }
  },
  __DEFAULT__: (node, context, site) => {
    expectSyntaxPropertyEqual(site, ["operator"], "=");
    return visit(node, context, {
      ...PATTERN,
      right: visit(site.right, context, EXPRESSION),
    });
  },
};
