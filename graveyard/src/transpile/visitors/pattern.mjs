import { some, map, flatMap, concat } from "array-lite";
import {
  assert,
  SyntaxAranError,
  partial_xx,
  partialx_,
} from "../../util/index.mjs";
import {
  makeConditionalEffect,
  makeApplyExpression,
  makeExpressionEffect,
  makeConditionalExpression,
  makeLiteralExpression,
  makeIntrinsicExpression,
} from "../../ast/index.mjs";
import {
  makeSetExpression,
  makeGetExpression,
  makeBinaryExpression,
  makeThrowTypeErrorExpression,
} from "../../intrinsic.mjs";
import {
  makeScopeBaseWriteEffectArray,
  makeScopeBaseInitializeStatementArray,
} from "../scope/index.mjs";
import { annotateArray } from "../annotate.mjs";
import { memoize } from "../memoize.mjs";
import {
  EXPRESSION,
  PATTERN,
  PATTERN_ELEMENT,
  PATTERN_PROPERTY,
  getKeySite,
} from "../site.mjs";
import { visit, liftEffect } from "../context.mjs";

const isRestElement = ({ type }) => type === "RestElement";

// Depth first:
//
// var iterator = () => ({
//   __proto__: null,
//   counter: 0,
//   next: function () {
//     console.log("yo", this.counter);
//     this.counter++;
//     return {
//       __proto__: null,
//       done: this.counter > 5,
//       value: undefined
//     }
//   }
// });
// var x, y;
// [(console.log("foo"), {})[(console.log("bar"))], x = console.log("qux"), y] = {__proto__:null, [Symbol.iterator]: iterator};
// foo
// bar
// yo 0
// yo 1
// qux
// yo 2

const makeCheckObjectEffectArray = (expression) => [
  makeConditionalEffect(
    makeConditionalExpression(
      makeBinaryExpression("===", expression, makeLiteralExpression(null)),
      makeLiteralExpression(true),
      makeBinaryExpression(
        "===",
        expression,
        makeLiteralExpression({ undefined: null }),
      ),
    ),
    [
      makeExpressionEffect(
        makeThrowTypeErrorExpression(
          "Cannot destructure 'undefined' or 'null'",
        ),
      ),
    ],
    [],
  ),
];

export default {
  __ANNOTATE__: annotateArray,
  Identifier: (node, context, site) => {
    if (site.kind === null) {
      return makeScopeBaseWriteEffectArray(context, node.name, site.right);
    } else {
      return makeScopeBaseInitializeStatementArray(
        context,
        site.kind,
        node.name,
        site.right,
      );
    }
  },
  // Safari:
  //
  // > [(console.log("foo"), {})[console.log("bar")] = console.log("qux")] = []
  // qux
  // foo
  // bar
  //
  // Chrome/Node/Firefox:
  //
  // > [(console.log("foo"), {})[console.log("bar")] = console.log("qux")] = []
  // foo
  // bar
  // qux
  //
  // We choose the safari evaluation order for consistency reason:
  // visitors of this file receives a box as right-hand side which means that it
  // has already been evaluated (or it has no side effects -- e.g. primitive).
  MemberExpression: (node, context, site) => {
    assert(
      !node.optional,
      SyntaxAranError,
      "illegal optional MemberExpression at %j",
      node.loc.start,
    );
    const memo = memoize(context, "right", site.right);
    return map(
      concat(memo.setup, [
        makeExpressionEffect(
          makeSetExpression(
            context.strict,
            visit(node.object, context, EXPRESSION),
            visit(node.property, context, getKeySite(node.computed)),
            memo.pure,
          ),
        ),
      ]),
      partialx_(liftEffect, site.kind),
    );
  },
  AssignmentPattern: (node, context, site) => {
    const memo = memoize(context, "right", site.right);
    return concat(
      map(memo.setup, partialx_(liftEffect, site.kind)),
      visit(node.left, context, {
        ...PATTERN,
        kind: site.kind,
        right: makeConditionalExpression(
          makeBinaryExpression(
            "===",
            memo.pure,
            makeLiteralExpression({ undefined: null }),
          ),
          visit(node.right, context, EXPRESSION),
          memo.pure,
        ),
      }),
    );
  },
  // Even empty pattern trigger getting a Symbol.iterator:
  //
  // > var p = new Proxy([], {
  //   __proto__: null,
  //   get: (tgt, key, rec) => (console.log("get", key), Reflect.get(tgt, key, rec))
  // });
  // undefined
  // > var [] = p;
  // get Symbol(Symbol.iterator)
  // undefined
  //
  // Not need to convert it to an ObjectExpression:
  //
  // > var iterator = () => "foo";
  // undefined
  // >  var [x, y, z] = {[Symbol.iterator]:iterator};
  // Thrown:
  // Typeglobal_Error: Result of the Symbol.iterator method is not an object
  //
  // Functions work:
  //
  // > var iterator = () => { var f = function () {}; f.next = () => ({}); return f; }
  // undefined
  // > var [x, y, z] = {[Symbol.iterator]:iterator};
  // undefined
  //
  // Not need to convert it to an ObjectExpression:
  //
  // > var iterator = () => ({__proto__: null, next:() => "foo"});
  // undefined
  // > var [x, y, z] = {__proto__:null, [Symbol.iterator]:iterator};
  // Thrown:
  // Typeglobal_Error: Typeglobal_Error: Iterator result foo is not an object
  //
  // Functions work:
  // > var iterator = () => ({__proto__: null, next:() => () => {}});
  // undefined
  // > var [x, y, z] = {__proto__:null, [Symbol.iterator]:iterator};
  // undefined
  ArrayPattern: (node, context, site) => {
    const right_memo = memoize(context, "right", site.right);
    const iterator_memo = memoize(
      context,
      "iterator",
      makeApplyExpression(
        makeGetExpression(
          right_memo.pure,
          makeIntrinsicExpression("Symbol.iterator"),
        ),
        right_memo.pure,
        [],
      ),
    );
    return concat(
      map(
        concat(right_memo.setup, iterator_memo.setup),
        partialx_(liftEffect, site.kind),
      ),
      flatMap(
        node.elements,
        partial_xx(visit, context, {
          ...PATTERN_ELEMENT,
          kind: site.kind,
          iterator: iterator_memo.pure,
        }),
      ),
    );
  },
  // We have to check if `null` or `undefined` before (even if no properties):
  //
  // > var {[(console.log("yo"), "foo")]:foo} = null;
  // Thrown:
  // TypeError: Cannot destructure 'undefined' or 'null'.
  // > var {} = null;
  // Thrown:
  // TypeError: Cannot destructure 'undefined' or 'null'.
  //
  // BUT we have to cast into `Object` at each property:
  //
  // > let thisfoo = null;
  // undefined
  // > let thisbar = null;
  // undefined
  // Reflect.defineKey(String.prototype, "foo", {
  //  get: function () {
  //     thisfoo = this;
  //     return "yolo";
  //   }
  // });
  // true
  // Reflect.defineKey(String.prototype, "bar", {
  //   get: function () {
  //     thisbar = this;
  //     return "swag";
  //   }
  // });
  // true
  // > var {foo,bar} = "qux";
  // undefined
  // > thisfoo
  // [String: 'qux']
  // > thisbar
  // [String: 'qux']
  // > thisfoo === thisbar
  // false
  ObjectPattern: (node, context, site) => {
    if (some(node.properties, isRestElement)) {
      const memo = memoize(context, "right", site.right);
      return concat(
        map(
          concat(memo.setup, makeCheckObjectEffectArray(memo.pure)),
          partialx_(liftEffect, site.kind),
        ),
        flatMap(
          node.properties,
          partial_xx(visit, context, {
            ...PATTERN_PROPERTY,
            kind: site.kind,
            right: memo.pure,
            keys: [],
          }),
        ),
      );
    } else {
      const memo = memoize(context, "right", site.right);
      return concat(
        map(
          concat(memo.setup, makeCheckObjectEffectArray(memo.pure)),
          partialx_(liftEffect, site.kind),
        ),
        flatMap(
          node.properties,
          partial_xx(visit, context, {
            ...PATTERN_PROPERTY,
            kind: site.kind,
            right: memo.pure,
          }),
        ),
      );
    }
  },
};
