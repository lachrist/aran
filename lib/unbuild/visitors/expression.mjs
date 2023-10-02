import {
  DynamicError,
  StaticError,
  enumerate,
  every,
  flatMap,
  map,
  reduceReverse,
  slice,
  some,
  zip,
  hasOwn,
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
  makeLongSequenceExpression,
} from "../intrinsic.mjs";
import {
  makeScopeReadExpression,
  makeScopeTypeofExpression,
} from "../scope/inner/index.mjs";
import { unbuildKeyEffect, unbuildKeyExpression } from "./key.mjs";
import { unbuildEffect } from "./effect.mjs";
import { unbuildUpdateExpression } from "./update.mjs";
import { unbuildPatternEffect } from "./pattern.mjs";
import { mangleMetaVariable } from "../mangle.mjs";
import { SyntaxAranError } from "../../error.mjs";
import { unbuildFunction } from "./function.mjs";
import { unbuildCallee } from "./callee.mjs";
import { unbuildSpreadable } from "./spreadable.mjs";
import {
  makeGetSuperExpression,
  makeImportMetaExpression,
  makeNewTargetExpression,
  makeThisExpression,
} from "../record.mjs";
import { unbuildQuasi } from "./quasi.mjs";
import {
  isInitProperty,
  isProtoProperty,
  unbuildInitProperty,
  unbuildProperty,
  unbuildProtoProperty,
} from "./property.mjs";
import { unbuildClass } from "./class.mjs";
import { ANONYMOUS } from "../name.mjs";
import { getPath } from "../annotate.mjs";

const {
  Reflect: { apply },
  String: {
    prototype: { slice: sliceString },
  },
} = globalThis;

const BASENAME = /** @basename */ "expression";

/** @type {(node: estree.Property) => boolean} */
const isSuperProperty = (node) => node.method || node.kind !== "init";

/**
 * @type {<S>(
 *   nodes: (estree.Property | estree.SpreadElement)[],
 *   context: import("../context.js").Context<S>,
 *   options: { serial: S },
 * ) => {
 *   prototype: aran.Expression<unbuild.Atom<S>>,
 *   properties: (estree.Property | estree.SpreadElement)[],
 * }}
 */
const extractPrototype = (nodes, context, { serial }) =>
  nodes.length > 0 && isProtoProperty(nodes[0])
    ? {
        prototype: unbuildProtoProperty(nodes[0], context),
        properties: slice(nodes, 1, nodes.length),
      }
    : {
        prototype: makeIntrinsicExpression("Object.prototype", serial),
        properties: nodes,
      };

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
 *   context: import("../context.js").Context<S>,
 *   options: { name: import("../name.mjs").Name }
 * ) => aran.Expression<unbuild.Atom<S>>}
 */
export const unbuildExpression = (node, context, { name }) => {
  const { serialize, digest } = context;
  const serial = serialize(node, getPath(node));
  const hash = digest(node, getPath(node));
  switch (node.type) {
    case "Literal":
      if (hasOwn(node, "regex")) {
        return makeApplyExpression(
          makeIntrinsicExpression("RegExp", serial),
          makePrimitiveExpression({ undefined: null }, serial),
          [
            makePrimitiveExpression(
              /** @type {estree.RegExpLiteral} */ (node).regex.pattern,
              serial,
            ),
            makePrimitiveExpression(
              /** @type {estree.RegExpLiteral} */ (node).regex.flags,
              serial,
            ),
          ],
          serial,
        );
      } else if (hasOwn(node, "bigint")) {
        return makePrimitiveExpression(
          { bigint: /** @type {estree.BigIntLiteral} */ (node).bigint },
          serial,
        );
      } else {
        return makePrimitiveExpression(
          /** @type {estree.SimpleLiteral} */ (node).value,
          serial,
        );
      }
    case "TemplateLiteral":
      if (node.expressions.length !== node.quasis.length - 1) {
        throw new SyntaxAranError("quasis / expressions length mismatch", node);
      }
      return reduceReverse(
        zip(node.quasis, node.expressions),
        (accumulation, [quasi, expression]) =>
          makeBinaryExpression(
            "+",
            makeBinaryExpression(
              "+",
              unbuildQuasi(quasi, context, { cooked: true }),
              unbuildExpression(expression, context, { name: ANONYMOUS }),
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
              unbuildExpression(child, context, { name: ANONYMOUS }),
            ),
          ],
        },
      });
    case "ThisExpression":
      return makeThisExpression(context, { serial, origin: node });
    case "MetaProperty":
      if (node.meta.name === "new" && node.property.name === "target") {
        return makeNewTargetExpression(context, { serial, origin: node });
      } else if (node.meta.name === "import" && node.property.name === "meta") {
        return makeImportMetaExpression(context, { serial, origin: node });
      } else {
        throw new DynamicError("invalid meta property", node);
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
          const right = mangleMetaVariable(hash, BASENAME, "right");
          return makeLongSequenceExpression(
            [
              makeWriteEffect(
                right,
                unbuildExpression(node.right, context, {
                  name:
                    node.left.type === "Identifier"
                      ? {
                          type: "static",
                          kind: "scope",
                          base: /** @type {estree.Variable} */ (node.left.type),
                        }
                      : ANONYMOUS,
                }),
                serial,
                true,
              ),
              ...unbuildPatternEffect(node.left, context, right),
            ],
            makeReadExpression(right, serial),
            serial,
          );
        }
      } else {
        return unbuildUpdateExpression(node.left, context, {
          update: unbuildExpression(node.right, context, { name: ANONYMOUS }),
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
                unbuildExpression(node.argument, context, { name: ANONYMOUS }),
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
                unbuildExpression(argument.object, context, {
                  name: ANONYMOUS,
                }),
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
            unbuildExpression(node.argument, context, { name: ANONYMOUS }),
            serial,
          );
      }
    case "BinaryExpression":
      return makeBinaryExpression(
        node.operator,
        unbuildExpression(node.left, context, { name: ANONYMOUS }),
        unbuildExpression(node.right, context, { name: ANONYMOUS }),
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
          { name: ANONYMOUS },
        ),
        serial,
      );
    case "ConditionalExpression":
      return makeConditionalExpression(
        unbuildExpression(node.test, context, { name: ANONYMOUS }),
        unbuildExpression(node.consequent, context, { name: ANONYMOUS }),
        unbuildExpression(node.alternate, context, { name: ANONYMOUS }),
        serial,
      );
    case "LogicalExpression": {
      const left = mangleMetaVariable(hash, BASENAME, "left");
      const setup = makeWriteEffect(
        left,
        unbuildExpression(node.left, context, { name: ANONYMOUS }),
        serial,
        true,
      );
      switch (node.operator) {
        case "&&":
          return makeSequenceExpression(
            setup,
            makeConditionalExpression(
              makeReadExpression(left, serial),
              unbuildExpression(node.right, context, { name: ANONYMOUS }),
              makeReadExpression(left, serial),
              serial,
            ),
            serial,
          );
        case "||":
          return makeSequenceExpression(
            setup,
            makeConditionalExpression(
              makeReadExpression(left, serial),
              makeReadExpression(left, serial),
              unbuildExpression(node.right, context, { name: ANONYMOUS }),
              serial,
            ),
            serial,
          );
        case "??":
          return makeSequenceExpression(
            setup,
            makeConditionalExpression(
              makeBinaryExpression(
                "==",
                makeReadExpression(left, serial),
                makePrimitiveExpression(null, serial),
                serial,
              ),
              unbuildExpression(node.right, context, { name: ANONYMOUS }),
              makeReadExpression(left, serial),
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
        unbuildExpression(node.argument, context, { name: ANONYMOUS }),
        serial,
      );
    case "YieldExpression":
      return makeYieldExpression(
        node.delegate,
        node.argument == null
          ? makePrimitiveExpression({ undefined: null }, serial)
          : unbuildExpression(node.argument, context, { name: ANONYMOUS }),
        serial,
      );
    case "ArrowFunctionExpression":
      return unbuildFunction(node, context, {
        kind: "arrow",
        name,
      });

    case "FunctionExpression":
      return unbuildFunction(
        node,
        {
          ...context,
          record: {
            ...context.record,
            "super.prototype": ".illegal",
            "super.constructor": ".illegal",
          },
        },
        {
          kind: "function",
          name,
        },
      );
    case "ClassExpression":
      return unbuildClass(node, context, { name });
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
          val: unbuildExpression(node_arguments[index], context, {
            name: ANONYMOUS,
          }),
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
              {
                ...context,
                path: getPath(node),
              },
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
                  unbuildExpression(child, context, { name: ANONYMOUS }),
                ),
              }
            : {
                type: "concat",
                value: makeApplyExpression(
                  makeIntrinsicExpression("Array.prototype.concat", serial),
                  makeArrayExpression([], serial),
                  map(node.arguments, (child) =>
                    unbuildSpreadable(child, context),
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
            unbuildExpression(child, context, {
              name: ANONYMOUS,
            }),
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
              : unbuildSpreadable(child, context),
          ),
          serial,
        );
      }
    }
    case "ImportExpression":
      return makeApplyExpression(
        makeReadExpression("import", serial),
        makePrimitiveExpression({ undefined: null }, serial),
        [unbuildExpression(node.source, context, { name: ANONYMOUS })],
        serial,
      );
    case "NewExpression":
      if (node.callee.type === "Super") {
        throw new SyntaxAranError(
          "super cannot be used as a constructor",
          node,
        );
      }
      if (every(node.arguments, isNotSpreadElement)) {
        return makeConstructExpression(
          unbuildExpression(node.callee, context, { name: ANONYMOUS }),
          map(node.arguments, (child) =>
            unbuildExpression(child, context, { name: ANONYMOUS }),
          ),
          serial,
        );
      } else {
        return makeApplyExpression(
          makeIntrinsicExpression("Reflect.construct", serial),
          makePrimitiveExpression({ undefined: null }, serial),
          [
            unbuildExpression(node.callee, context, { name: ANONYMOUS }),
            makeApplyExpression(
              makeIntrinsicExpression("Array.prototype.concat", serial),
              makeArrayExpression([], serial),
              map(node.arguments, (child) => unbuildSpreadable(child, context)),
              serial,
            ),
          ],
          serial,
        );
      }
    case "ChainExpression":
      return unbuildExpression(node.expression, context, { name: ANONYMOUS });
    case "MemberExpression":
      if (node.optional) {
        if (node.object.type === "Super") {
          throw new SyntaxAranError(
            "super be used in a optional member expression",
            node,
          );
        }
        const object = mangleMetaVariable(hash, BASENAME, "object");
        return makeSequenceExpression(
          makeWriteEffect(
            object,
            unbuildExpression(node.object, context, { name: ANONYMOUS }),
            serial,
            true,
          ),
          makeConditionalExpression(
            makeBinaryExpression(
              "==",
              makeReadExpression(object, serial),
              makePrimitiveExpression(null, serial),
              serial,
            ),
            makePrimitiveExpression({ undefined: null }, serial),
            makeGetExpression(
              makeReadExpression(object, serial),
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
            { serial, origin: node },
          );
        } else {
          return makeGetExpression(
            unbuildExpression(node.object, context, { name: ANONYMOUS }),
            unbuildKeyExpression(node.property, context, node),
            serial,
          );
        }
      }
    case "ObjectExpression": {
      const { prototype, properties } = extractPrototype(
        node.properties,
        context,
        { serial },
      );
      if (every(properties, isInitProperty)) {
        if (some(properties, isSuperProperty)) {
          const self_var = mangleMetaVariable(hash, BASENAME, "self");
          const self_val = makeObjectExpression(
            prototype,
            map(properties, (child) =>
              unbuildInitProperty(child, context, { self: self_var }),
            ),
            serial,
          );
          return makeSequenceExpression(
            makeWriteEffect(self_var, self_val, serial, true),
            makeReadExpression(self_var, serial),
            serial,
          );
        } else {
          return makeObjectExpression(
            prototype,
            map(properties, (child) =>
              unbuildInitProperty(child, context, { self: null }),
            ),
            serial,
          );
        }
      } else {
        const self = mangleMetaVariable(hash, BASENAME, "self");
        return makeLongSequenceExpression(
          [
            makeWriteEffect(
              self,
              makeObjectExpression(prototype, [], serial),
              serial,
              true,
            ),
            ...flatMap(properties, (child) =>
              unbuildProperty(child, context, { self }),
            ),
          ],
          makeReadExpression(self, serial),
          serial,
        );
      }
    }
    default:
      throw new StaticError("invalid expression node", node);
  }
};
