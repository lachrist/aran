import {
  DynamicError,
  enumerate,
  every,
  flatMap,
  map,
  reduceReverse,
  slice,
  zip,
} from "../../util/index.mjs";

import {
  makeApplyExpression,
  makeAwaitExpression,
  makeConditionalExpression,
  makeConstructExpression,
  makeEvalExpression,
  makeIntrinsicExpression,
  makePrimitiveExpression,
  makeReadExpression,
  makeSequenceExpression,
  makeWriteEffect,
  makeYieldExpression,
} from "../node.mjs";

import {
  makeArrayExpression,
  makeBinaryExpression,
  makeDataDescriptorExpression,
  makeDeleteExpression,
  makeGetExpression,
  makeObjectExpression,
  makeThrowErrorExpression,
  makeUnaryExpression,
} from "../intrinsic.mjs";

import {
  makeScopeReadExpression,
  makeScopeTypeofExpression,
} from "../scope/inner/index.mjs";

import { makeLongSequenceExpression } from "../sequence.mjs";

import { unbuildKeyEffect, unbuildKeyExpression } from "./key.mjs";

import { unbuildEffect } from "./effect.mjs";
import { unbuildUpdateExpression } from "./update.mjs";
import { unbuildPatternEffect } from "./pattern.mjs";
import { mangleMetaVariable } from "../mangle.mjs";
import {
  DynamicSyntaxAranError,
  StaticSyntaxAranError,
  SyntaxAranError,
} from "../../error.mjs";
import { isBigIntLiteral, isRegExpLiteral } from "../../estree/index.mjs";
import { unbuildFunctionExpression } from "./function.mjs";
import { unbuildCallee } from "./callee.mjs";
import { unbuildSpreadable } from "./spreadable.mjs";
import { makeGetSuperExpression } from "../super.mjs";
import { unbuildQuasi } from "./quasi.mjs";

const {
  Reflect: { apply },
  String: {
    prototype: { slice: sliceString },
  },
} = globalThis;

const BASENAME = /** @basename */ "expression";

/** @type {(node: estree.Node) => estree.Node} */
const extractChain = (node) =>
  node.type === "ChainExpression" ? extractChain(node.expression) : node;

/** @type {<X>(node: X | null) => node is X} */
const isNotNull = (node) => node !== null;

/** @type {(node: estree.Expression | estree.SpreadElement) => node is estree.Expression} */
const isNotSpreadElement = (node) => node.type !== "SpreadElement";

/**
 * @type {<S>(
 *   node: estree.Expression,
 *   context: import("./context.js").Context<S>,
 *   name: estree.Variable | null,
 * ) => aran.Expression<unbuild.Atom<S>>}
 */
export const unbuildExpression = (node, context, name) => {
  const { serialize, digest } = context;
  const serial = serialize(node);
  const hash = digest(node);
  switch (node.type) {
    case "ThisExpression":
      return makeReadExpression("this", serial);
    case "MetaProperty":
      if (node.meta.name === "new" && node.property.name === "target") {
        return makeReadExpression("new.target", serial);
      } else if (node.meta.name === "import" && node.property.name === "meta") {
        return makeReadExpression("import.meta", serial);
      } else {
        throw new DynamicError("invalid meta property", node);
      }
    case "Literal":
      if (isRegExpLiteral(node)) {
        return makeApplyExpression(
          makeIntrinsicExpression("RegExp", serial),
          makePrimitiveExpression({ undefined: null }, serial),
          [
            makePrimitiveExpression(node.regex.pattern, serial),
            makePrimitiveExpression(node.regex.flags, serial),
          ],
          serial,
        );
      } else if (isBigIntLiteral(node)) {
        return makePrimitiveExpression({ bigint: node.bigint }, serial);
      } else {
        return makePrimitiveExpression(node.value, serial);
      }
    case "Identifier":
      return makeScopeReadExpression(
        context,
        /** @type {estree.Variable} */ (node.name),
        serial,
      );
    case "AssignmentExpression":
      if (node.operator === "=") {
        // > (console.log('foo') = 123);
        // foo
        // Uncaught ReferenceError: Invalid left-hand side in assignment
        if (
          /** @type {estree.Expression} */ (node.left).type === "CallExpression"
        ) {
          return makeLongSequenceExpression(
            unbuildEffect(
              /** @type {estree.Expression} */ (node.left),
              context,
            ),
            makeThrowErrorExpression(
              "ReferenceError",
              "Invalid left-hand side in assignment",
              serial,
            ),
            serial,
          );
        } else {
          const right = {
            var: mangleMetaVariable(hash, BASENAME, "right"),
            val: unbuildExpression(node.right, context, null),
          };
          return makeLongSequenceExpression(
            [
              makeWriteEffect(right.var, right.val, serial, true),
              ...unbuildPatternEffect(node.left, context, right.var),
            ],
            makeReadExpression(right.var, serial),
            serial,
          );
        }
      } else {
        return unbuildUpdateExpression(node.left, context, {
          update: unbuildExpression(node.right, context, null),
          prefix: true,
          operator: /** @type {estree.BinaryOperator} */ (
            apply(sliceString, node.operator, [0, -1])
          ),
          serial,
          hash,
        });
      }
    case "UpdateExpression":
      return unbuildUpdateExpression(node.argument, context, {
        update: makePrimitiveExpression(1, serial),
        prefix: node.prefix,
        operator: /** @type {estree.BinaryOperator} */ (node.operator[0]),
        serial,
        hash,
      });
    case "UnaryExpression":
      switch (node.operator) {
        case "typeof":
          return node.argument.type === "Identifier"
            ? makeScopeTypeofExpression(
                context,
                /** @type {estree.Variable} */ (node.argument.name),
                serial,
              )
            : makeUnaryExpression(
                node.operator,
                unbuildExpression(node.argument, context, null),
                serial,
              );
        case "delete": {
          const argument = extractChain(node.argument);
          if (argument.type === "MemberExpression") {
            if (argument.object.type === "Super") {
              return makeLongSequenceExpression(
                unbuildKeyEffect(argument.property, context, argument),
                makeThrowErrorExpression(
                  "ReferenceError",
                  "Unsupported reference to 'super'",
                  serial,
                ),
                serial,
              );
            } else {
              return makeDeleteExpression(
                context.strict,
                unbuildExpression(argument.object, context, null),
                unbuildKeyExpression(argument.property, context, argument),
                serial,
              );
            }
          } else {
            return makeLongSequenceExpression(
              unbuildEffect(node, context),
              makePrimitiveExpression(true, serial),
              serial,
            );
          }
        }
        default:
          return makeUnaryExpression(
            node.operator,
            unbuildExpression(node.argument, context, null),
            serial,
          );
      }
    case "BinaryExpression":
      return makeBinaryExpression(
        node.operator,
        unbuildExpression(node.left, context, null),
        unbuildExpression(node.right, context, null),
        serial,
      );
    case "SequenceExpression":
      return makeLongSequenceExpression(
        flatMap(
          slice(node.expressions, 0, node.expressions.length - 1),
          (child) => unbuildEffect(child, context),
        ),
        unbuildExpression(
          node.expressions[node.expressions.length - 1],
          context,
          null,
        ),
        serial,
      );
    case "ConditionalExpression":
      return makeConditionalExpression(
        unbuildExpression(node.test, context, null),
        unbuildExpression(node.consequent, context, null),
        unbuildExpression(node.alternate, context, null),
        serial,
      );
    case "LogicalExpression": {
      const left = {
        var: mangleMetaVariable(hash, BASENAME, "left"),
        val: unbuildExpression(node.left, context, null),
      };
      switch (node.operator) {
        case "&&":
          return makeSequenceExpression(
            makeWriteEffect(left.var, left.val, serial, true),
            makeConditionalExpression(
              makeReadExpression(left.var, serial),
              unbuildExpression(node.right, context, null),
              makeReadExpression(left.var, serial),
              serial,
            ),
            serial,
          );
        case "||":
          return makeSequenceExpression(
            makeWriteEffect(left.var, left.val, serial, true),
            makeConditionalExpression(
              makeReadExpression(left.var, serial),
              makeReadExpression(left.var, serial),
              unbuildExpression(node.right, context, null),
              serial,
            ),
            serial,
          );
        case "??":
          return makeSequenceExpression(
            makeWriteEffect(left.var, left.val, serial, true),
            makeConditionalExpression(
              makeBinaryExpression(
                "==",
                makeReadExpression(left.var, serial),
                makePrimitiveExpression(null, serial),
                serial,
              ),
              unbuildExpression(node.right, context, null),
              makeReadExpression(left.var, serial),
              serial,
            ),
            serial,
          );
        default:
          throw new SyntaxAranError("Invalid logical operator", node);
      }
    }
    case "AwaitExpression":
      return makeAwaitExpression(
        unbuildExpression(node.argument, context, null),
        serial,
      );
    case "YieldExpression":
      return makeYieldExpression(
        node.delegate,
        node.argument == null
          ? makePrimitiveExpression({ undefined: null }, serial)
          : unbuildExpression(node.argument, context, null),
        serial,
      );
    case "ArrowFunctionExpression":
      return unbuildFunctionExpression(node, context, { kind: "arrow", name });
    case "FunctionExpression":
      return unbuildFunctionExpression(node, context, {
        kind: "function",
        name,
      });
    case "CallExpression": {
      if (
        node.callee.type === "Identifier" &&
        node.callee.name === "eval" &&
        node.arguments.length > 1 &&
        every(node.arguments, isNotSpreadElement)
      ) {
        // https://herringtondarkholme.github.io/2017/02/04/flow-sensitive/
        const node_arguments = node.arguments;
        const caches = map(enumerate(node.arguments.length), (index) => ({
          var: mangleMetaVariable(hash, BASENAME, `eval_arg_${index}`),
          val: unbuildExpression(node_arguments[index], context, null),
        }));
        return makeLongSequenceExpression(
          map(caches, (cache) =>
            makeWriteEffect(cache.var, cache.val, serial, true),
          ),
          makeConditionalExpression(
            makeBinaryExpression(
              "===",
              makeScopeReadExpression(
                context,
                /** @type {estree.Variable} */ ("eval"),
                serial,
              ),
              makeIntrinsicExpression("eval", serial),
              serial,
            ),
            makeEvalExpression(
              makeReadExpression(caches[0].var, serial),
              serial,
            ),
            makeApplyExpression(
              makeScopeReadExpression(
                context,
                /** @type {estree.Variable} */ ("eval"),
                serial,
              ),
              makePrimitiveExpression({ undefined: null }, serial),
              map(caches, (cache) => makeReadExpression(cache.var, serial)),
              serial,
            ),
            serial,
          ),
          serial,
        );
      } else {
        return unbuildCallee(node.callee, context, {
          optional: node.optional,
          arguments: every(node.arguments, isNotSpreadElement)
            ? {
                type: "spread",
                values: map(node.arguments, (child) =>
                  unbuildExpression(child, context, null),
                ),
              }
            : {
                type: "concat",
                value: makeApplyExpression(
                  makeIntrinsicExpression("Array.prototype.concat", serial),
                  makeArrayExpression([], serial),
                  map(node.arguments, (child) =>
                    unbuildSpreadable(child, context, {}),
                  ),
                  serial,
                ),
              },
        });
      }
    }
    case "ArrayExpression": {
      if (
        every(node.elements, isNotNull) &&
        every(node.elements, isNotSpreadElement)
      ) {
        return makeArrayExpression(
          map(node.elements, (child) =>
            unbuildExpression(child, context, null),
          ),
          serial,
        );
      } else {
        return makeApplyExpression(
          makeIntrinsicExpression("Array.prototype.concat", serial),
          makeArrayExpression([], serial),
          map(node.elements, (child) =>
            child === null
              ? // Array(1) is succeptible to pollution of
                // Array.prototype and Object.prototype
                makeObjectExpression(
                  makePrimitiveExpression(null, serial),
                  [
                    [
                      makePrimitiveExpression("length", serial),
                      makePrimitiveExpression(1, serial),
                    ],
                    [
                      makeIntrinsicExpression(
                        "Symbol.isConcatSpreadable",
                        serial,
                      ),
                      makePrimitiveExpression(true, serial),
                    ],
                  ],
                  serial,
                )
              : unbuildSpreadable(child, context, {}),
          ),
          serial,
        );
      }
    }
    case "ImportExpression":
      return makeApplyExpression(
        makeReadExpression("import", serial),
        makePrimitiveExpression({ undefined: null }, serial),
        [unbuildExpression(node.source, context, null)],
        serial,
      );
    case "NewExpression":
      if (node.callee.type === "Super") {
        throw new DynamicSyntaxAranError(
          "super cannot be used as a constructor",
          node,
        );
      }
      if (every(node.arguments, isNotSpreadElement)) {
        return makeConstructExpression(
          unbuildExpression(node.callee, context, null),
          map(node.arguments, (child) =>
            unbuildExpression(child, context, null),
          ),
          serial,
        );
      } else {
        return makeApplyExpression(
          makeIntrinsicExpression("Reflect.construct", serial),
          makePrimitiveExpression({ undefined: null }, serial),
          [
            unbuildExpression(node.callee, context, null),
            makeApplyExpression(
              makeIntrinsicExpression("Array.prototype.concat", serial),
              makeArrayExpression([], serial),
              map(node.arguments, (child) =>
                unbuildSpreadable(child, context, {}),
              ),
              serial,
            ),
          ],
          serial,
        );
      }
    case "ChainExpression":
      return unbuildExpression(node.expression, context, name);
    case "MemberExpression":
      if (node.optional) {
        if (node.object.type === "Super") {
          throw new DynamicSyntaxAranError(
            "super be used in a optional member expression",
            node,
          );
        }
        const object = {
          var: mangleMetaVariable(hash, BASENAME, "object"),
          val: unbuildExpression(node.object, context, null),
        };
        return makeSequenceExpression(
          makeWriteEffect(object.var, object.val, serial, true),
          makeConditionalExpression(
            makeBinaryExpression(
              "==",
              makeReadExpression(object.var, serial),
              makePrimitiveExpression(null, serial),
              serial,
            ),
            makePrimitiveExpression({ undefined: null }, serial),
            makeGetExpression(
              makeReadExpression(object.var, serial),
              unbuildKeyExpression(node.property, context, node),
              serial,
            ),
            serial,
          ),
          serial,
        );
      } else {
        if (node.object.type === "Super") {
          return makeGetSuperExpression(
            context,
            unbuildKeyExpression(node.property, context, node),
            serial,
          );
        } else {
          return makeGetExpression(
            unbuildExpression(node.object, context, null),
            unbuildKeyExpression(node.property, context, node),
            serial,
          );
        }
      }
    case "TemplateLiteral":
      if (node.expressions.length !== node.quasis.length - 1) {
        throw new DynamicSyntaxAranError(
          "quasis / expressions length mismatch",
          node,
        );
      }
      return reduceReverse(
        zip(node.quasis, node.expressions),
        (accumulation, [quasi, expression]) =>
          makeBinaryExpression(
            "+",
            makeBinaryExpression(
              "+",
              unbuildQuasi(quasi, context, { cooked: true }),
              unbuildExpression(expression, context, null),
              serial,
            ),
            accumulation,
            serial,
          ),
        unbuildQuasi(node.quasis[node.quasis.length - 1], context, {
          cooked: true,
        }),
      );
    // Tagged template cannot lead to a direct eval call because it receives an array instead of a string:
    // cf: https://www.ecma-international.org/ecma-262/10.0/index.html#sec-performeval
    case "TaggedTemplateExpression":
      return unbuildCallee(node.tag, context, {
        optional: false,
        arguments: {
          type: "spread",
          values: [
            // TODO: cache somewhere the first argument... but where?
            // For any particular tagged template literal expression, the tag
            // function will always be called with the exact same literal array,
            // no matter how many times the literal is evaluated.
            // -- https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Template_literals#tagged_templates
            makeApplyExpression(
              makeIntrinsicExpression("Object.freeze", serial),
              makePrimitiveExpression({ undefined: null }, serial),
              [
                makeApplyExpression(
                  makeIntrinsicExpression("Object.defineProperty", serial),
                  makePrimitiveExpression({ undefined: null }, serial),
                  [
                    makeArrayExpression(
                      map(node.quasi.quasis, (quasi) =>
                        unbuildQuasi(quasi, context, { cooked: true }),
                      ),
                      serial,
                    ),
                    makePrimitiveExpression("raw", serial),
                    makeDataDescriptorExpression(
                      makePrimitiveExpression(false, serial),
                      makePrimitiveExpression(false, serial),
                      makePrimitiveExpression(false, serial),
                      makeApplyExpression(
                        makeIntrinsicExpression("Object.freeze", serial),
                        makePrimitiveExpression({ undefined: null }, serial),
                        [
                          makeArrayExpression(
                            map(node.quasi.quasis, (quasi) =>
                              unbuildQuasi(quasi, context, { cooked: false }),
                            ),
                            serial,
                          ),
                        ],
                        serial,
                      ),
                      serial,
                    ),
                  ],
                  serial,
                ),
              ],
              serial,
            ),
            ...map(node.quasi.expressions, (child) =>
              unbuildExpression(child, context, null),
            ),
          ],
        },
      });
    case "ClassExpression":
      return TODO;
    case "ObjectExpression":
      return TODO;
    default:
      throw new StaticSyntaxAranError(BASENAME, node);
  }
};
