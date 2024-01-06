/* eslint-disable no-use-before-define */
import { map, flatMap } from "../util/index.mjs";
import {
  isBigIntPrimitive,
  isParameter,
  isUndefinedPrimitive,
  unpackPrimitive,
  isNanPrimitive,
  isInfinityPrimitive,
  isZeroPrimitive,
} from "../lang.mjs";
import { mangleParameter, mangleImport, mangleVariable } from "./mangle.mjs";
import { AranTypeError } from "../error.mjs";
import { rebuildClosureBlock } from "./block.mjs";
import { rebuildEffect } from "./effect.mjs";
import {
  isArrayDesign,
  isBinaryDesign,
  isMemberDesign,
  isObjectDesign,
  isUnaryDesign,
} from "./design.mjs";

const { BigInt } = globalThis;

/** @type {(node: estree.Expression) => estree.Expression} */
const sanitizeMemberExpression = (node) =>
  node.type === "MemberExpression"
    ? {
        type: "SequenceExpression",
        expressions: [{ type: "Literal", value: null }, node],
      }
    : node;

/**
 * @type {(
 * node1: aran.Expression<rebuild.Atom>,
 * node2: aran.Expression<rebuild.Atom>,
 * ) => boolean}
 */
const isInvocable = (node1, node2) => {
  if (
    node1.type === "IntrinsicExpression" &&
    node2.type === "IntrinsicExpression" &&
    node1.intrinsic === node2.intrinsic
  ) {
    return true;
  }
  if (
    node1.type === "ReadExpression" &&
    node2.type === "ReadExpression" &&
    node1.variable === node2.variable
  ) {
    return true;
  }
  if (
    node1.type === "PrimitiveExpression" &&
    node2.type === "PrimitiveExpression" &&
    unpackPrimitive(node1.primitive) === unpackPrimitive(node2.primitive)
  ) {
    return true;
  }
  return false;
};

/** @type {(node: estree.Expression) => estree.Expression[]} */
const extractSequence = (node) =>
  node.type === "SequenceExpression" ? node.expressions : [node];

/**
 * @type {(
 *   node: aran.Expression<rebuild.Atom>,
 *   context: import("./context.js").Context,
 * ) => estree.Expression}
 */
export const rebuildExpression = (node, context) => {
  if (isMemberDesign(node)) {
    return {
      type: "MemberExpression",
      optional: false,
      computed: true,
      object: rebuildExpression(node.arguments[0], context),
      property: rebuildExpression(node.arguments[1], context),
    };
  } else if (isUnaryDesign(node)) {
    if (node.arguments[0].primitive === "delete") {
      return {
        type: "SequenceExpression",
        expressions: [
          rebuildExpression(node.arguments[1], context),
          {
            type: "Literal",
            value: true,
          },
        ],
      };
    } else {
      return {
        type: "UnaryExpression",
        operator: node.arguments[0].primitive,
        prefix: true,
        argument: rebuildExpression(node.arguments[1], context),
      };
    }
  } else if (isBinaryDesign(node)) {
    return {
      type: "BinaryExpression",
      operator: node.arguments[0].primitive,
      left: rebuildExpression(node.arguments[1], context),
      right: rebuildExpression(node.arguments[2], context),
    };
  } else if (isArrayDesign(node)) {
    return {
      type: "ArrayExpression",
      elements: map(node.arguments, (child) =>
        rebuildExpression(child, context),
      ),
    };
  } else if (isObjectDesign(node)) {
    return {
      type: "ObjectExpression",
      properties: map(
        node.arguments[0].arguments,
        ({ arguments: [key, value] }) => ({
          type: "Property",
          shorthand: false,
          kind: "init",
          method: false,
          computed: true,
          key: rebuildExpression(key, context),
          value: rebuildExpression(value, context),
        }),
      ),
    };
  } else {
    switch (node.type) {
      case "FunctionExpression": {
        return {
          type: "FunctionExpression",
          id: null,
          async: node.asynchronous,
          generator: node.generator,
          params: [
            {
              type: "RestElement",
              argument: {
                type: "Identifier",
                name: mangleParameter("function.arguments", context.escape),
              },
            },
          ],
          body: {
            type: "BlockStatement",
            body: rebuildClosureBlock(node.body, context, {
              completion: "closure",
            }),
          },
        };
      }
      case "ArrowExpression": {
        return {
          type: "ArrowFunctionExpression",
          async: node.asynchronous,
          expression: false,
          params: [
            {
              type: "RestElement",
              argument: {
                type: "Identifier",
                name: mangleParameter("function.arguments", context.escape),
              },
            },
          ],
          body: {
            type: "BlockStatement",
            body: rebuildClosureBlock(node.body, context, {
              completion: "closure",
            }),
          },
        };
      }
      case "PrimitiveExpression": {
        if (isUndefinedPrimitive(node.primitive)) {
          return {
            type: "UnaryExpression",
            operator: "void",
            prefix: true,
            argument: {
              type: "Literal",
              value: 0,
            },
          };
        } else if (isNanPrimitive(node.primitive)) {
          return {
            type: "BinaryExpression",
            operator: "/",
            left: {
              type: "Literal",
              value: 0,
            },
            right: {
              type: "Literal",
              value: 0,
            },
          };
        } else if (isZeroPrimitive(node.primitive)) {
          switch (node.primitive.zero) {
            case "+": {
              return {
                type: "Literal",
                value: 0,
              };
            }
            case "-": {
              return {
                type: "UnaryExpression",
                operator: "-",
                prefix: true,
                argument: {
                  type: "Literal",
                  value: 0,
                },
              };
            }
            default: {
              throw new AranTypeError(node.primitive.zero);
            }
          }
        } else if (isInfinityPrimitive(node.primitive)) {
          switch (node.primitive.infinity) {
            case "+": {
              return {
                type: "BinaryExpression",
                operator: "/",
                left: {
                  type: "Literal",
                  value: 1,
                },
                right: {
                  type: "Literal",
                  value: 0,
                },
              };
            }
            case "-": {
              return {
                type: "BinaryExpression",
                operator: "/",
                left: {
                  type: "UnaryExpression",
                  operator: "-",
                  prefix: true,
                  argument: {
                    type: "Literal",
                    value: 1,
                  },
                },
                right: {
                  type: "Literal",
                  value: 0,
                },
              };
            }
            default: {
              throw new AranTypeError(node.primitive.infinity);
            }
          }
        } else if (isBigIntPrimitive(node.primitive)) {
          return {
            type: "Literal",
            value: BigInt(node.primitive.bigint),
            bigint: node.primitive.bigint,
          };
        } else {
          return {
            type: "Literal",
            value: node.primitive,
          };
        }
      }
      case "IntrinsicExpression": {
        return {
          type: "MemberExpression",
          optional: false,
          computed: true,
          object: {
            type: "Identifier",
            name: context.intrinsic,
          },
          property: {
            type: "Literal",
            value: node.intrinsic,
          },
        };
      }
      case "ReadExpression": {
        return {
          type: "Identifier",
          name: isParameter(node.variable)
            ? mangleParameter(node.variable, context.escape)
            : mangleVariable(node.variable, context.escape),
        };
      }
      case "ImportExpression": {
        return {
          type: "Identifier",
          name: mangleImport(node.source, node.import, context.escape),
        };
      }
      case "AwaitExpression": {
        return {
          type: "AwaitExpression",
          argument: rebuildExpression(node.promise, context),
        };
      }
      case "YieldExpression": {
        return {
          type: "YieldExpression",
          delegate: node.delegate,
          argument: rebuildExpression(node.item, context),
        };
      }
      case "ConditionalExpression": {
        return {
          type: "ConditionalExpression",
          test: rebuildExpression(node.condition, context),
          consequent: rebuildExpression(node.consequent, context),
          alternate: rebuildExpression(node.alternate, context),
        };
      }
      case "SequenceExpression": {
        return {
          type: "SequenceExpression",
          expressions: [
            ...flatMap(node.head, (node) =>
              extractSequence(rebuildEffect(node, context)),
            ),
            ...extractSequence(rebuildExpression(node.tail, context)),
          ],
        };
      }
      case "EvalExpression": {
        return {
          type: "CallExpression",
          optional: false,
          callee: {
            type: "Identifier",
            name: "eval",
          },
          arguments: [rebuildExpression(node.code, context)],
        };
      }
      case "ConstructExpression": {
        return {
          type: "NewExpression",
          callee: rebuildExpression(node.callee, context),
          arguments: map(node.arguments, (child) =>
            rebuildExpression(child, context),
          ),
        };
      }
      case "ApplyExpression": {
        if (
          node.this.type === "PrimitiveExpression" &&
          isUndefinedPrimitive(node.this.primitive)
        ) {
          return {
            type: "CallExpression",
            optional: false,
            callee: sanitizeMemberExpression(
              rebuildExpression(node.callee, context),
            ),
            arguments: map(node.arguments, (child) =>
              rebuildExpression(child, context),
            ),
          };
        } else if (
          node.callee.type === "ApplyExpression" &&
          node.callee.callee.type === "IntrinsicExpression" &&
          node.callee.callee.intrinsic === "aran.get" &&
          node.callee.this.type === "PrimitiveExpression" &&
          node.callee.arguments.length === 2 &&
          isInvocable(node.this, node.callee.arguments[0])
        ) {
          return {
            type: "CallExpression",
            optional: false,
            callee: {
              type: "MemberExpression",
              optional: false,
              computed: true,
              object: rebuildExpression(node.callee.arguments[0], context),
              property: rebuildExpression(node.callee.arguments[1], context),
            },
            arguments: map(node.arguments, (child) =>
              rebuildExpression(child, context),
            ),
          };
        } else {
          return {
            type: "CallExpression",
            optional: false,
            callee: {
              type: "MemberExpression",
              optional: false,
              computed: true,
              object: {
                type: "Identifier",
                name: context.intrinsic,
              },
              property: {
                type: "Literal",
                value: "Reflect.apply",
              },
            },
            arguments: [
              rebuildExpression(node.callee, context),
              rebuildExpression(node.this, context),
              {
                type: "ArrayExpression",
                elements: map(node.arguments, (child) =>
                  rebuildExpression(child, context),
                ),
              },
            ],
          };
        }
      }
      default: {
        throw new AranTypeError(node);
      }
    }
  }
};
