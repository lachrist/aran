import { concat } from "array-lite";
import { reduceReverse } from "../../util/index.mjs";
import { makeSequenceExpression } from "../../ast/index.mjs";
import {
  makeGetExpression,
  makeSetExpression,
  makeBinaryExpression,
} from "../../intrinsic.mjs";
import {
  makeScopeBaseLooseWriteEffectArray,
  makeScopeBaseReadExpression,
} from "../scope/index.mjs";
import { annotate } from "../annotate.mjs";
import { memoize } from "../memoize.mjs";
import { expectSyntaxPropertyEqual } from "../report.mjs";
import {
  EXPRESSION,
  EXPRESSION_MEMO,
  PATTERN,
  getKeySite,
  getKeyMemoSite,
} from "../site.mjs";
import { visit } from "../context.mjs";

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
  __ANNOTATE__: annotate,
  Identifier: (node, context, site) => {
    if (site.operator === "=") {
      const memo = visit(site.right, context, {
        ...EXPRESSION_MEMO,
        info: "right",
        name: node.name,
      });
      return reduceReverse(
        concat(
          memo.setup,
          makeScopeBaseLooseWriteEffectArray(context, node.name, memo.pure),
        ),
        makeSequenceExpression,
        memo.pure,
      );
    } else {
      // Name are not transmitted on update:
      //
      // > var f = "foo"
      // undefined
      // > f += function () {}
      // 'foofunction () {}'
      const memo = memoize(
        context,
        "right",
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
      return reduceReverse(
        concat(
          memo.setup,
          makeScopeBaseLooseWriteEffectArray(context, node.name, memo.pure),
        ),
        makeSequenceExpression,
        memo.pure,
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
      const object_memo = visit(node.object, context, {
        ...EXPRESSION_MEMO,
        info: "object",
      });
      const key_memo = visit(
        node.property,
        context,
        getKeyMemoSite(node.computed),
      );
      return reduceReverse(
        concat(object_memo.setup, key_memo.setup),
        makeSequenceExpression,
        makeSetExpression(
          context.strict,
          object_memo.pure,
          key_memo.pure,
          makeBinaryExpression(
            apply(substring, site.operator, [0, site.operator.length - 1]),
            makeGetExpression(object_memo.pure, key_memo.pure),
            visit(site.right, context, EXPRESSION),
          ),
        ),
      );
    }
  },
  __DEFAULT__: (node, context, site) => {
    expectSyntaxPropertyEqual(site, ["operator"], "=");
    const memo = visit(site.right, context, {
      ...EXPRESSION_MEMO,
      info: "right",
    });
    return reduceReverse(
      concat(
        memo.setup,
        visit(node, context, {
          ...PATTERN,
          right: memo.pure,
        }),
      ),
      makeSequenceExpression,
      memo.pure,
    );
  },
};
