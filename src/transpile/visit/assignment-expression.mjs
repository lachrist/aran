import { concat } from "array-lite";
import { reduceReverse } from "../../util/index.mjs";
import {
  annotateNode,
  makeLiteralExpression,
  makeSequenceExpression,
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
  makeScopeBaseMacroWriteEffectArray,
  makeScopeBaseReadExpression,
} from "../scope/index.mjs";
import { expectSyntaxPropertyEqual } from "./report.mjs";
import { visit, EXPRESSION, getKeySite } from "./context.mjs";

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
  __ANNOTATE__: annotateNode,
  Identifier: (node, context, site) => {
    if (site.operator === "=") {
      const variable = declareScopeMeta(
        context,
        "AssignmentExpressionIdentifierRight",
      );
      return reduceReverse(
        concat(
          makeScopeMetaWriteEffectArray(
            context,
            variable,
            visit(site.right, context, {
              type: "Expression",
              name: makeLiteralExpression(node.name),
            }),
          ),
          makeScopeBaseMacroWriteEffectArray(
            context,
            node.name,
            makeScopeMetaReadExpression(context, variable),
          ),
        ),
        makeSequenceExpression,
        makeScopeMetaReadExpression(context, variable),
      );
    } else {
      const variable = declareScopeMeta(
        context,
        "AssignmentExpressionIdentifierResult",
      );
      return reduceReverse(
        concat(
          makeScopeMetaWriteEffectArray(
            context,
            variable,
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
          ),
          makeScopeBaseMacroWriteEffectArray(
            context,
            node.name,
            makeScopeMetaReadExpression(context, variable),
          ),
        ),
        makeSequenceExpression,
        makeScopeMetaReadExpression(context, variable),
      );
    }
  },
  MemberExpression: (node, context, site) => {
    expectSyntaxPropertyEqual(node, ["optional"], false);
    if (site.operator === "=") {
      return makeSetExpression(
        context.strict,
        visit(node.object, context, EXPRESSION),
        visit(node.property, context, getKeySite(node.computed)),
        visit(site.right, context, EXPRESSION),
      );
    } else {
      const object_variable = declareScopeMeta(
        context,
        "AssignmentExpressionMemberExpressionObject",
      );
      const property_variable = declareScopeMeta(
        context,
        "AssignmentExpressionMemberExpressionKey",
      );
      return reduceReverse(
        concat(
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
        ),
        makeSequenceExpression,
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
      );
    }
  },
  __DEFAULT__: (node, context, site) => {
    expectSyntaxPropertyEqual(site, ["operator"], "=");
    const variable = declareScopeMeta(context, "assignment_pattern_right");
    return reduceReverse(
      concat(
        makeScopeMetaWriteEffectArray(
          context,
          variable,
          visit(site.right, context, EXPRESSION),
        ),
        visit(node, context, {
          type: "Pattern",
          kind: null,
          right: makeScopeMetaReadExpression(context, variable),
        }),
      ),
      makeSequenceExpression,
      makeScopeMetaReadExpression(context, variable),
    );
  },
};
