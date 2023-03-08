import { some, concat, reduce, map, flatMap, slice } from "array-lite";
import {
  reduceReverse,
  partial_xx,
  partial_x,
  SyntaxAranError,
} from "../../util/index.mjs";
import {
  makeConstructExpression,
  makeIntrinsicExpression,
  makeConditionalExpression,
  makeSequenceExpression,
  makeApplyExpression,
  makeYieldExpression,
  makeAwaitExpression,
  makeLiteralExpression,
} from "../../ast/index.mjs";
import {
  makeIsNullishExpression,
  makeObjectExpression,
  makeGetExpression,
  makeUnaryExpression,
  makeArrayExpression,
  makeObjectFreezeExpression,
  makeObjectDefinePropertyExpression,
  makeDataDescriptorExpression,
  makeBinaryExpression,
} from "../../intrinsic.mjs";
import {
  isDirectEvalCall,
  isPrototypeProperty,
  isAccessorProperty,
  isSuperProperty,
} from "../../query/index.mjs";
import {
  makeScopeEvalExpression,
  makeScopeBaseReadExpression,
  makeScopeSpecReadExpression,
} from "../scope/index.mjs";
import { annotate } from "../annotate.mjs";
import { memoize } from "../memoize.mjs";
import {
  expectSyntaxPropertyNotEqual,
  makeSyntaxPropertyError,
} from "../report.mjs";
import {
  SPREAD,
  QUASI_RAW,
  QUASI,
  EXPRESSION,
  EXPRESSION_MEMO,
  EFFECT,
  DELETE,
  CALLEE,
  CLOSURE,
  CLASS,
  OBJECT_PROPERTY,
  OBJECT_PROPERTY_REGULAR,
  OBJECT_PROPERTY_PROTOTYPE,
  ASSIGNMENT_EXPRESSION,
  UPDATE_EXPRESSION,
  getKeySite,
} from "../site.mjs";
import { visit } from "../context.mjs";

const { Array } = globalThis;

const getPure = ({ pure }) => pure;

const getSetup = ({ setup }) => setup;

const isNull = (any) => any === null;

const isSpreadElement = ({ type }) => type === "SpreadElement";

const visitArraySpreadElement = (element, context) => {
  if (element === null) {
    // Array(1) does not work because of Array.prototype and Object.prototype pollution:
    // Array.prototype[0] = "foo";
    // Array.prototype[1] = "bar";
    // console.log([, , , ].indexOf("foo"));
    // console.log([, , , ].indexOf("bar"));
    return makeObjectExpression(makeLiteralExpression(null), [
      { key: makeLiteralExpression("length"), value: makeLiteralExpression(1) },
    ]);
  } else {
    return visit(element, context, SPREAD);
  }
};

const visitProtoProperty = (properties, context) => {
  if (properties.length > 0 && isPrototypeProperty(properties[0])) {
    return {
      prototype: visit(properties[0], context, OBJECT_PROPERTY_PROTOTYPE),
      properties: slice(properties, 1, properties.length),
    };
  } else {
    return {
      prototype: makeIntrinsicExpression("Object.prototype"),
      properties,
    };
  }
};

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
  __ANNOTATE__: annotate,
  // Producer //
  Literal: (node, _context, _site) => makeLiteralExpression(node.value),
  Identifier: (node, context, _site) =>
    makeScopeBaseReadExpression(context, node.name),
  ThisExpression: (_node, context, _site) =>
    makeScopeSpecReadExpression(context, "this"),
  MetaProperty: (node, context, _site) =>
    makeScopeSpecReadExpression(context, getMetaPropertyVariable(node)),
  ArrowFunctionExpression: (node, context, site) =>
    visit(node, context, {
      ...CLOSURE,
      kind: "arrow",
      name: makeLiteralExpression(site.name),
    }),
  FunctionExpression: (node, context, site) =>
    visit(node, context, {
      ...CLOSURE,
      kind: "function",
      name: makeLiteralExpression(node.id === null ? site.name : node.id.name),
    }),
  ClassExpression: (node, context, site) =>
    visit(node, context, {
      ...CLASS,
      name: makeLiteralExpression(node.id === null ? site.name : node.id.name),
    }),
  // Combinators //
  TemplateLiteral: (node, context, _site) =>
    node.expressions.length === 0
      ? visit(node.quasis[0], context, QUASI)
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
                  visit(node.quasis[index + 1], context, QUASI),
                  visit(node.expressions[index + 1], context, EXPRESSION),
                ),
              ),
            makeBinaryExpression(
              "+",
              visit(node.quasis[0], context, QUASI),
              visit(node.expressions[0], context, EXPRESSION),
            ),
          ),
          visit(node.quasis[node.quasis.length - 1], context, QUASI),
        ),
  // Tagged template cannot lead to a direct eval call because it receives an array instead of a string:
  // cf: https://www.ecma-international.org/ecma-262/10.0/index.html#sec-performeval
  TaggedTemplateExpression: (node, context, _site) => {
    const { callee: callee_expression, this: this_expression } = visit(
      node.tag,
      context,
      CALLEE,
    );
    return makeApplyExpression(
      callee_expression,
      this_expression,
      concat(
        [
          makeObjectFreezeExpression(
            makeObjectDefinePropertyExpression(
              makeArrayExpression(
                map(node.quasi.quasis, partial_xx(visit, context, QUASI)),
              ),
              makeLiteralExpression("raw"),
              makeDataDescriptorExpression(
                makeObjectFreezeExpression(
                  makeArrayExpression(
                    map(
                      node.quasi.quasis,
                      partial_xx(visit, context, QUASI_RAW),
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
        map(node.quasi.expressions, partial_xx(visit, context, EXPRESSION)),
      ),
    );
  },
  AwaitExpression: (node, context, _site) =>
    makeAwaitExpression(visit(node.argument, context, EXPRESSION)),
  YieldExpression: (node, context, _site) =>
    makeYieldExpression(
      node.delegate,
      node.argument === null
        ? makeLiteralExpression({ undefined: null })
        : visit(node.argument, context, EXPRESSION),
    ),
  AssignmentExpression: (node, context, _site) =>
    visit(node.left, context, {
      ...ASSIGNMENT_EXPRESSION,
      operator: node.operator,
      right: node.right,
    }),
  UpdateExpression: (node, context, _site) =>
    visit(node.argument, context, {
      ...UPDATE_EXPRESSION,
      operator: node.operator,
      prefix: node.prefix,
    }),
  /////////////
  // Control //
  /////////////
  // Function's name are not propagated through sequences:
  //
  // > var o = {x:(123, function () {})}
  // undefined
  // > o
  // { x: [Function] }
  // > o.x.name
  // ''
  SequenceExpression: (node, context, _site) => {
    expectSyntaxPropertyNotEqual(node, ["expressions", "length"], 0);
    return reduceReverse(
      flatMap(
        slice(node.expressions, 0, node.expressions.length - 1),
        partial_xx(visit, context, EFFECT),
      ),
      makeSequenceExpression,
      visit(node.expressions[node.expressions.length - 1], context, EXPRESSION),
    );
  },
  ConditionalExpression: (node, context, _site) =>
    makeConditionalExpression(
      visit(node.test, context, EXPRESSION),
      visit(node.consequent, context, EXPRESSION),
      visit(node.alternate, context, EXPRESSION),
    ),
  LogicalExpression: (node, context, _site) => {
    const memo = visit(node.left, context, {
      ...EXPRESSION_MEMO,
      info: "logical",
    });
    if (node.operator === "&&") {
      return reduceReverse(
        memo.setup,
        makeSequenceExpression,
        makeConditionalExpression(
          memo.pure,
          visit(node.right, context, EXPRESSION),
          memo.pure,
        ),
      );
    } else if (node.operator === "||") {
      return reduceReverse(
        memo.setup,
        makeSequenceExpression,
        makeConditionalExpression(
          memo.pure,
          memo.pure,
          visit(node.right, context, EXPRESSION),
        ),
      );
    } else if (node.operator === "??") {
      return reduceReverse(
        memo.setup,
        makeSequenceExpression,
        makeConditionalExpression(
          makeConditionalExpression(
            makeBinaryExpression("===", memo.pure, makeLiteralExpression(null)),
            makeLiteralExpression(true),
            makeBinaryExpression(
              "===",
              memo.pure,
              makeLiteralExpression({ undefined: null }),
            ),
          ),
          visit(node.right, context, EXPRESSION),
          memo.pure,
        ),
      );
    } /* c8 ignore start */ else {
      throw makeSyntaxPropertyError(node, ["operator"]);
    } /* c8 ignore stop */
  },
  // Operation //
  UnaryExpression: (node, context, _site) => {
    if (node.operator === "delete") {
      return visit(node.argument, context, DELETE);
    } else if (node.operator === "void") {
      return reduceReverse(
        visit(node.argument, context, EFFECT),
        makeSequenceExpression,
        makeLiteralExpression({ undefined: null }),
      );
    } else {
      return makeUnaryExpression(
        node.operator,
        visit(node.argument, context, EXPRESSION),
      );
    }
  },
  BinaryExpression: (node, context, _site) =>
    makeBinaryExpression(
      node.operator,
      visit(node.left, context, EXPRESSION),
      visit(node.right, context, EXPRESSION),
    ),
  ChainExpression: (node, context, _site) =>
    visit(node.expression, context, EXPRESSION),
  MemberExpression: (node, context, _site) => {
    if (node.optional) {
      const memo = visit(node.object, context, {
        ...EXPRESSION_MEMO,
        info: "optional",
      });
      return reduceReverse(
        memo.setup,
        makeSequenceExpression,
        makeConditionalExpression(
          makeConditionalExpression(
            makeBinaryExpression("===", memo.pure, makeLiteralExpression(null)),
            makeLiteralExpression(true),
            makeBinaryExpression(
              "===",
              memo.pure,
              makeLiteralExpression({ undefined: null }),
            ),
          ),
          makeLiteralExpression({ undefined: null }),
          makeGetExpression(
            memo.pure,
            visit(node.property, context, getKeySite(node.computed)),
          ),
        ),
      );
    } else {
      return makeGetExpression(
        visit(node.object, context, EXPRESSION),
        visit(node.property, context, getKeySite(node.computed)),
      );
    }
  },
  ImportExpression: (node, context, _site) =>
    makeApplyExpression(
      makeScopeSpecReadExpression(context, "import"),
      makeLiteralExpression({ undefined: null }),
      [visit(node.source, context, EXPRESSION)],
    ),
  ArrayExpression: (node, context, _site) => {
    if (some(node.elements, isNull) || some(node.elements, isSpreadElement)) {
      return makeApplyExpression(
        makeIntrinsicExpression("Array.prototype.flat"),
        makeArrayExpression(
          map(node.elements, partial_x(visitArraySpreadElement, context)),
        ),
        [],
      );
    } else {
      return makeArrayExpression(
        map(node.elements, partial_xx(visit, context, EXPRESSION)),
      );
    }
  },
  ObjectExpression: (node, context, _site) => {
    const { prototype, properties } = visitProtoProperty(
      node.properties,
      context,
    );
    if (
      some(properties, isPrototypeProperty) ||
      some(properties, isAccessorProperty) ||
      some(properties, isSpreadElement)
    ) {
      if (some(properties, isSuperProperty)) {
        const prototype_memo = memoize(context, "prototype", prototype);
        const super_memo = memoize(
          context,
          "super",
          makeObjectExpression(prototype_memo.pure, []),
        );
        const self_memo = memoize(
          context,
          "self",
          makeObjectExpression(prototype_memo.pure, []),
        );
        return reduceReverse(
          concat(
            prototype_memo.setup,
            super_memo.setup,
            self_memo.setup,
            flatMap(
              properties,
              partial_xx(visit, context, {
                ...OBJECT_PROPERTY,
                super: super_memo.pure,
                self: self_memo.pure,
              }),
            ),
          ),
          makeSequenceExpression,
          self_memo.pure,
        );
      } else {
        const self_memo = memoize(
          context,
          "self",
          makeObjectExpression(prototype, []),
        );
        return reduceReverse(
          concat(
            self_memo.setup,
            flatMap(
              properties,
              partial_xx(visit, context, {
                ...OBJECT_PROPERTY,
                self: self_memo.pure,
              }),
            ),
          ),
          makeSequenceExpression,
          self_memo.pure,
        );
      }
    } else {
      if (some(properties, isSuperProperty)) {
        const prototype_memo = memoize(context, "prototype", prototype);
        const super_memo = memoize(
          context,
          "super",
          makeObjectExpression(prototype_memo.pure, []),
        );
        return reduceReverse(
          concat(prototype_memo.setup, super_memo.setup),
          makeSequenceExpression,
          makeObjectExpression(
            prototype_memo.pure,
            map(
              properties,
              partial_xx(visit, context, {
                ...OBJECT_PROPERTY_REGULAR,
                super: super_memo.pure,
              }),
            ),
          ),
        );
      } else {
        return makeObjectExpression(
          prototype,
          map(properties, partial_xx(visit, context, OBJECT_PROPERTY_REGULAR)),
        );
      }
    }
  },
  // Super return value is this:
  //
  // {
  //   class C {
  //     constructor () {
  //       return {__proto__:null, foo:123};
  //     }
  //   }
  //   class D extends C {
  //     constructor () {
  //       console.log(super() === this);
  //     }
  //   }
  //   new D();
  // }
  CallExpression: (node, context, _site) => {
    if (isDirectEvalCall(node)) {
      if (some(node.arguments, isSpreadElement)) {
        const callee_memo = visit(node.callee, context, {
          ...EXPRESSION_MEMO,
          info: "callee",
        });
        const argument_array_memo = memoize(
          context,
          "arguments",
          makeApplyExpression(
            makeIntrinsicExpression("Array.prototype.flat"),
            makeArrayExpression(
              map(node.arguments, partial_xx(visit, context, SPREAD)),
            ),
            [],
          ),
        );
        return reduceReverse(
          concat(callee_memo.setup, argument_array_memo.setup),
          makeSequenceExpression,
          makeConditionalExpression(
            makeBinaryExpression(
              "===",
              callee_memo.pure,
              makeIntrinsicExpression("eval"),
            ),
            makeScopeEvalExpression(
              context,
              makeGetExpression(
                argument_array_memo.pure,
                makeLiteralExpression(0),
              ),
            ),
            makeApplyExpression(
              makeIntrinsicExpression("Reflect.apply"),
              makeLiteralExpression({ undefined: null }),
              [
                callee_memo.pure,
                makeLiteralExpression({ undefined: null }),
                argument_array_memo.pure,
              ],
            ),
          ),
        );
      } else {
        const callee_memo = visit(node.callee, context, {
          ...EXPRESSION_MEMO,
          info: "callee",
        });
        const argument_memo_array = map(
          node.arguments,
          partial_xx(visit, context, { ...EXPRESSION_MEMO, info: "argument" }),
        );
        return reduceReverse(
          concat(callee_memo.setup, flatMap(argument_memo_array, getSetup)),
          makeSequenceExpression,
          makeConditionalExpression(
            makeBinaryExpression(
              "===",
              callee_memo.pure,
              makeIntrinsicExpression("eval"),
            ),
            makeScopeEvalExpression(context, argument_memo_array[0].pure),
            makeApplyExpression(
              callee_memo.pure,
              makeLiteralExpression({ undefined: null }),
              map(argument_memo_array, getPure),
            ),
          ),
        );
      }
    } else {
      if (some(node.arguments, isSpreadElement)) {
        if (node.optional) {
          const callee = visit(node.callee, context, CALLEE);
          const callee_memo = memoize(context, "callee", callee.callee);
          return reduceReverse(
            callee_memo.setup,
            makeSequenceExpression,
            makeConditionalExpression(
              makeIsNullishExpression(callee_memo.pure),
              makeLiteralExpression({ undefined: null }),
              makeApplyExpression(
                makeIntrinsicExpression("Reflect.apply"),
                makeLiteralExpression({ undefined: null }),
                [
                  callee_memo.pure,
                  callee.this,
                  makeApplyExpression(
                    makeIntrinsicExpression("Array.prototype.flat"),
                    makeArrayExpression(
                      map(node.arguments, partial_xx(visit, context, SPREAD)),
                    ),
                    [],
                  ),
                ],
              ),
            ),
          );
        } else {
          const callee = visit(node.callee, context, CALLEE);
          return makeApplyExpression(
            makeIntrinsicExpression("Reflect.apply"),
            makeLiteralExpression({ undefined: null }),
            [
              callee.callee,
              callee.this,
              makeApplyExpression(
                makeIntrinsicExpression("Array.prototype.flat"),
                makeArrayExpression(
                  map(node.arguments, partial_xx(visit, context, SPREAD)),
                ),
                [],
              ),
            ],
          );
        }
      } else {
        if (node.optional) {
          const callee = visit(node.callee, context, CALLEE);
          const callee_memo = memoize(context, "callee", callee.callee);
          return reduceReverse(
            callee_memo.setup,
            makeSequenceExpression,
            makeConditionalExpression(
              makeIsNullishExpression(callee_memo.pure),
              makeLiteralExpression({ undefined: null }),
              makeApplyExpression(
                callee_memo.pure,
                callee.this,
                map(node.arguments, partial_xx(visit, context, EXPRESSION)),
              ),
            ),
          );
        } else {
          const callee = visit(node.callee, context, CALLEE);
          return makeApplyExpression(
            callee.callee,
            callee.this,
            map(node.arguments, partial_xx(visit, context, EXPRESSION)),
          );
        }
      }
    }
  },
  NewExpression: (node, context, _site) => {
    if (some(node.arguments, isSpreadElement)) {
      return makeApplyExpression(
        makeIntrinsicExpression("Reflect.construct"),
        makeLiteralExpression({ undefined: null }),
        [
          visit(node.callee, context, EXPRESSION),
          makeApplyExpression(
            makeIntrinsicExpression("Array.prototype.flat"),
            makeArrayExpression(
              map(node.arguments, partial_xx(visit, context, SPREAD)),
            ),
            [],
          ),
        ],
      );
    } else {
      return makeConstructExpression(
        visit(node.callee, context, EXPRESSION),
        map(node.arguments, partial_xx(visit, context, EXPRESSION)),
      );
    }
  },
};
