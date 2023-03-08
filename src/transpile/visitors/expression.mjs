import { some, concat, reduce, map, flatMap, slice } from "array-lite";
import {
  reduceReverse,
  partial_xx,
  SyntaxAranError,
} from "../../util/index.mjs";
import {
  makeIntrinsicExpression,
  makeConditionalExpression,
  makeSequenceExpression,
  makeApplyExpression,
  makeYieldExpression,
  makeAwaitExpression,
  makeLiteralExpression,
} from "../../ast/index.mjs";
import {
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
  isProtoProperty,
  isAccessorProperty,
  isMethodProperty,
} from "../../query/index.mjs";
import {
  makeScopeBaseReadExpression,
  makeScopeSpecReadExpression,
} from "../scope/index.mjs";
import { annotate } from "../annotate.mjs";
import { makeMacro, makeMacroSelf } from "../macro.mjs";
import {
  expectSyntaxPropertyNotEqual,
  makeSyntaxPropertyError,
} from "../report.mjs";
import {
  QUASI_RAW,
  QUASI,
  EXPRESSION,
  EXPRESSION_MACRO,
  EFFECT,
  DELETE,
  CALLEE,
  CLOSURE,
  CLASS,
  OBJECT_PROPERTY,
  OBJECT_PROPERTY_REGULAR,
  ASSIGNMENT_EXPRESSION,
  UPDATE_EXPRESSION,
  getKeySite,
} from "../site.mjs";
import { visit } from "../context.mjs";

const { Array } = globalThis;

const isSpreadElement = ({ type }) => type === "SpreadElement";

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
    const macro = visit(node.left, context, {
      ...EXPRESSION_MACRO,
      info: "logical",
    });
    if (node.operator === "&&") {
      return reduceReverse(
        macro.setup,
        makeSequenceExpression,
        makeConditionalExpression(
          macro.value,
          visit(node.right, context, EXPRESSION),
          macro.value,
        ),
      );
    } else if (node.operator === "||") {
      return reduceReverse(
        macro.setup,
        makeSequenceExpression,
        makeConditionalExpression(
          macro.value,
          macro.value,
          visit(node.right, context, EXPRESSION),
        ),
      );
    } else if (node.operator === "??") {
      return reduceReverse(
        macro.setup,
        makeSequenceExpression,
        makeConditionalExpression(
          makeConditionalExpression(
            makeBinaryExpression(
              "===",
              macro.value,
              makeLiteralExpression(null),
            ),
            makeLiteralExpression(true),
            makeBinaryExpression(
              "===",
              macro.value,
              makeLiteralExpression({ undefined: null }),
            ),
          ),
          visit(node.right, context, EXPRESSION),
          macro.value,
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
      const macro = visit(node.object, context, {
        ...EXPRESSION_MACRO,
        info: "optional",
      });
      return reduceReverse(
        macro.setup,
        makeSequenceExpression,
        makeConditionalExpression(
          makeConditionalExpression(
            makeBinaryExpression(
              "===",
              macro.value,
              makeLiteralExpression(null),
            ),
            makeLiteralExpression(true),
            makeBinaryExpression(
              "===",
              macro.value,
              makeLiteralExpression({ undefined: null }),
            ),
          ),
          makeLiteralExpression({ undefined: null }),
          makeGetExpression(
            macro.value,
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
  ObjectExpression: (node, context, _site) => {
    // TODO: optimize when proto property is first //
    if (
      some(node.properties, isProtoProperty) ||
      some(node.properties, isAccessorProperty) ||
      some(node.properties, isSpreadElement)
    ) {
      const macro = makeMacro(
        context,
        "self",
        makeObjectExpression(makeIntrinsicExpression("Object.prototype"), []),
      );
      return reduceReverse(
        concat(
          macro.setup,
          flatMap(
            node.properties,
            partial_xx(visit, context, {
              ...OBJECT_PROPERTY,
              self: macro.value,
            }),
          ),
        ),
        makeSequenceExpression,
        macro.value,
      );
    } else if (some(node.properties, isMethodProperty)) {
      const macro = makeMacroSelf(context, "self", (expression) =>
        makeObjectExpression(
          makeIntrinsicExpression("Object.prototype"),
          map(
            node.properties,
            partial_xx(visit, context, {
              ...OBJECT_PROPERTY_REGULAR,
              self: expression,
            }),
          ),
        ),
      );
      return reduceReverse(macro.setup, makeSequenceExpression, macro.value);
    } else {
      return makeObjectExpression(
        makeIntrinsicExpression("Object.prototype"),
        map(
          node.properties,
          partial_xx(visit, context, OBJECT_PROPERTY_REGULAR),
        ),
      );
    }
  },
};
