import { some, map, flatMap, concat } from "array-lite";
import {
  push,
  assert,
  SyntaxAranError,
  partial_xx,
  partialx___,
} from "../../util/index.mjs";
import { DEFAULT_CLAUSE } from "../../node.mjs";
import {
  makeApplyExpression,
  makeEffectStatement,
  makeExpressionEffect,
  makeConditionalExpression,
  makeLiteralExpression,
  makeIntrinsicExpression,
  makeSequenceExpression,
} from "../../ast/index.mjs";
import {
  makeObjectExpression,
  makeObjectAssignExpression,
  makeSetExpression,
  makeGetExpression,
  makeBinaryExpression,
  makeThrowTypeErrorExpression,
  makeDeleteStrictExpression,
  makeArrayFromExpression,
} from "../../intrinsic.mjs";
import {
  makeScopeBaseWriteEffect,
  makeScopeBaseInitializeStatementArray,
  makeScopeMetaReadExpression,
  makeScopeMetaWriteEffect,
  declareScopeMeta,
} from "../scope/index.mjs";
import { visit, visitMany } from "./context.mjs";

const { Error } = globalThis;

const isRestElement = ({ type }) => type === "RestElement";

const ANONYMOUS = { name: null };

const visitProperty = partialx___(visit, "Property");
const visitExpression = partialx___(visit, "Expression");
const visitPattern = partialx___(visitMany, "Pattern");
const visitPatternProperty = partialx___(visitMany, "PatternProperty");
const visitPatternElement = partialx___(visitMany, "PatternElement");

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

const liftEffect = (kind, effect) =>
  kind === null ? effect : makeEffectStatement(effect);

const makeCheckObjectEffect = (context, variable) =>
  makeExpressionEffect(
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
      makeThrowTypeErrorExpression("Cannot destructure 'undefined' or 'null'"),
      makeLiteralExpression({ undefined: null }),
    ),
  );

export default {
  Pattern: {
    Identifier: (node, context, site) => {
      if (site.kind === null) {
        return [makeScopeBaseWriteEffect(context, node.name, site.right)];
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
      const variable = declareScopeMeta(context, "pattern_member_right");
      return [
        liftEffect(
          site.kind,
          makeScopeMetaWriteEffect(context, variable, site.right),
        ),
        liftEffect(
          site.kind,
          makeExpressionEffect(
            makeSetExpression(
              context.strict,
              visitExpression(node.object, context, ANONYMOUS),
              visitProperty(node.property, context, node),
              makeScopeMetaReadExpression(context, variable),
            ),
          ),
        ),
      ];
    },
    AssignmentPattern: (node, context, site) => {
      const variable = declareScopeMeta(context, "pattern_assignment_right");
      return concat(
        [
          liftEffect(
            site.kind,
            makeScopeMetaWriteEffect(context, variable, site.right),
          ),
        ],
        visitPattern(node.left, context, {
          kind: site.kind,
          right: makeConditionalExpression(
            makeBinaryExpression(
              "===",
              makeScopeMetaReadExpression(context, variable),
              makeLiteralExpression({ undefined: null }),
            ),
            visitExpression(node.right, context, ANONYMOUS),
            makeScopeMetaReadExpression(context, variable),
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
      const right_variable = declareScopeMeta(context, "pattern_array_right");
      const iterator_variable = declareScopeMeta(
        context,
        "pattern_array_iterator",
      );
      return concat(
        [
          liftEffect(
            site.kind,
            makeScopeMetaWriteEffect(context, right_variable, site.right),
          ),
          liftEffect(
            site.kind,
            makeScopeMetaWriteEffect(
              context,
              iterator_variable,
              makeApplyExpression(
                makeGetExpression(
                  makeScopeMetaReadExpression(context, right_variable),
                  makeIntrinsicExpression("Symbol.iterator"),
                ),
                makeScopeMetaReadExpression(context, right_variable),
                [],
              ),
            ),
          ),
        ],
        flatMap(
          node.elements,
          partial_xx(visitPatternElement, context, {
            kind: site.kind,
            iterator_variable,
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
    // Reflect.defineProperty(String.prototype, "foo", {
    //  get: function () {
    //     thisfoo = this;
    //     return "yolo";
    //   }
    // });
    // true
    // Reflect.defineProperty(String.prototype, "bar", {
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
        const right_variable = declareScopeMeta(
          context,
          "pattern_object_right",
        );
        const key_variable_array = [];
        return concat(
          [
            liftEffect(
              site.kind,
              makeScopeMetaWriteEffect(context, right_variable, site.right),
            ),
            liftEffect(
              site.kind,
              makeCheckObjectEffect(context, right_variable),
            ),
          ],
          flatMap(
            node.properties,
            partial_xx(visitPatternProperty, context, {
              kind: site.kind,
              right_variable,
              key_variable_array,
            }),
          ),
        );
      } else {
        const right_variable = declareScopeMeta(
          context,
          "pattern_object_right",
        );
        return concat(
          [
            liftEffect(
              site.kind,
              makeScopeMetaWriteEffect(context, right_variable, site.right),
            ),
            liftEffect(
              site.kind,
              makeCheckObjectEffect(context, right_variable),
            ),
          ],
          flatMap(
            node.properties,
            partial_xx(visitPatternProperty, context, {
              kind: site.kind,
              right_variable,
              key_variable_array: null,
            }),
          ),
        );
      }
    },
  },
  PatternElement: {
    RestElement: (node, context, site) =>
      visitPattern(node.argument, context, {
        kind: site.kind,
        right: makeArrayFromExpression(
          makeScopeMetaReadExpression(context, site.iterator_variable),
        ),
      }),
    [DEFAULT_CLAUSE]: (node, context, site) =>
      visitPattern(node, context, {
        kind: site.kind,
        right: makeApplyExpression(
          makeGetExpression(
            makeScopeMetaReadExpression(context, site.iterator_variable),
            makeLiteralExpression("next"),
          ),
          makeScopeMetaReadExpression(context, site.iterator_variable),
          [],
        ),
      }),
  },
  PatternProperty: {
    Property: (node, context, site) => {
      if (site.key_variable_array === null) {
        return visitPattern(node.value, context, {
          kind: site.kind,
          right: makeGetExpression(
            makeScopeMetaReadExpression(context, site.right_variable),
            visitProperty(node.key, context, node),
          ),
        });
      } else {
        const key_variable = declareScopeMeta(context, "pattern_object_key");
        push(site.key_variable_array, key_variable);
        return visitPattern(node.value, context, {
          kind: site.kind,
          right: makeGetExpression(
            makeScopeMetaReadExpression(context, site.right_variable),
            makeSequenceExpression(
              makeScopeMetaWriteEffect(
                context,
                key_variable,
                visitProperty(node.key, context, node),
              ),
              makeScopeMetaReadExpression(context, key_variable),
            ),
          ),
        });
      }
    },
    RestElement: (node, context, site) => {
      assert(
        site.key_variable_array !== null,
        Error,
        "missing array of key variables",
      );
      const rest_variable = declareScopeMeta(context, "pattern_object_rest");
      return concat(
        [
          liftEffect(
            site.kind,
            makeScopeMetaWriteEffect(
              context,
              rest_variable,
              makeObjectAssignExpression(
                makeObjectExpression(
                  makeIntrinsicExpression("Object.prototype"),
                  [],
                ),
                makeScopeMetaReadExpression(context, site.right_variable),
              ),
            ),
          ),
        ],
        map(site.key_variable_array, (variable_key) =>
          liftEffect(
            site.kind,
            makeExpressionEffect(
              makeDeleteStrictExpression(
                makeScopeMetaReadExpression(context, rest_variable),
                makeScopeMetaReadExpression(context, variable_key),
              ),
            ),
          ),
        ),
        visitPattern(node.argument, context, {
          kind: site.kind,
          right: makeScopeMetaReadExpression(context, rest_variable),
        }),
      );
    },
  },
};
