import { concat } from "array-lite";
import { reduceReverse, partialx___ } from "../../util/index.mjs";
import { DEFAULT_CLAUSE } from "../../node.mjs";
import {
  makeSequenceExpression,
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
  makeScopeBaseMacroWriteEffectArray,
  makeScopeBaseWriteEffectArray,
  makeScopeBaseReadExpression,
} from "../scope/index.mjs";
import { expectSyntaxEqual } from "./report.mjs";
import { visit, visitMany } from "./context.mjs";

const {
  Reflect: { apply },
  String: {
    prototype: { substring },
  },
} = globalThis;

const ANONYMOUS = { name: null };

const visitKey = partialx___(visit, "Key");
const visitPattern = partialx___(visitMany, "Pattern");
const visitExpression = partialx___(visit, "Expression");

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
  AssignmentEffect: {
    Identifier: (node, context, site) => {
      if (site.operator === "=") {
        return makeScopeBaseWriteEffectArray(
          context,
          node.name,
          visitExpression(site.right, context, node),
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
            visitExpression(site.right, context, ANONYMOUS),
          ),
        );
      }
    },
    MemberExpression: (node, context, site) => {
      if (site.operator === "=") {
        return [
          makeExpressionEffect(
            makeSetExpression(
              context.strict,
              visitExpression(node.object, context, ANONYMOUS),
              visitKey(node.property, context, node),
              visitKey(site.right, context, ANONYMOUS),
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
            visitExpression(node.object, context, ANONYMOUS),
          ),
          makeScopeMetaWriteEffectArray(
            context,
            property_variable,
            visitKey(node.property, context, node),
          ),
          [
            makeExpressionEffect(
              makeSetExpression(
                context.strict,
                makeScopeMetaReadExpression(context, object_variable),
                makeScopeMetaReadExpression(context, property_variable),
                makeBinaryExpression(
                  apply(substring, site.operator, [
                    0,
                    site.operator.length - 1,
                  ]),
                  makeGetExpression(
                    makeScopeMetaReadExpression(context, object_variable),
                    makeScopeMetaReadExpression(context, property_variable),
                  ),
                  visitExpression(site.right, context, ANONYMOUS),
                ),
              ),
            ),
          ],
        );
      }
    },
    [DEFAULT_CLAUSE]: (node, context, site) => {
      expectSyntaxEqual(site, "operator", "=");
      return visitPattern(node, context, {
        kind: null,
        right: visitExpression(site.right, context, ANONYMOUS),
      });
    },
  },
  AssignmentExpression: {
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
              visitExpression(site.right, context, node),
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
                visitExpression(site.right, context, ANONYMOUS),
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
      if (site.operator === "=") {
        return makeSetExpression(
          context.strict,
          visitExpression(node.object, context, ANONYMOUS),
          visitKey(node.property, context, node),
          visitKey(site.right, context, ANONYMOUS),
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
              visitExpression(node.object, context, ANONYMOUS),
            ),
            makeScopeMetaWriteEffectArray(
              context,
              property_variable,
              visitKey(node.property, context, node),
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
              visitExpression(site.right, context, ANONYMOUS),
            ),
          ),
        );
      }
    },
    [DEFAULT_CLAUSE]: (node, context, site) => {
      expectSyntaxEqual(site, "operator", "=");
      const variable = declareScopeMeta(context, "assignment_pattern_right");
      return reduceReverse(
        concat(
          makeScopeMetaWriteEffectArray(
            context,
            variable,
            visitExpression(site.right, context, ANONYMOUS),
          ),
          visitPattern(node, context, {
            kind: null,
            right: makeScopeMetaReadExpression(context, variable),
          }),
        ),
        makeSequenceExpression,
        makeScopeMetaReadExpression(context, variable),
      );
    },
  },
};
