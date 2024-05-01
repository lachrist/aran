/* eslint-disable no-use-before-define */
import { map, flatMap, slice, pairupArray, concatXX } from "../util/index.mjs";
import { isParameter, unpackPrimitive } from "../lang.mjs";
import {
  mangleParameter,
  mangleImport,
  mangleVariable,
  EVAL_IDENTIFIER,
  NEW_TARGET,
} from "./mangle.mjs";
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
import { makeIntrinsicExpression } from "./intrinsic.mjs";
import { makePrimitiveExpression } from "./primitive.mjs";

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
 *   config: import("./config").Config,
 * ) => estree.Expression}
 */
export const rebuildExpression = (node, config) => {
  if (isMemberDesign(node)) {
    return {
      type: "MemberExpression",
      optional: false,
      computed: true,
      object: rebuildExpression(node.arguments[0], config),
      property: rebuildExpression(node.arguments[1], config),
    };
  } else if (isUnaryDesign(node)) {
    if (node.arguments[0].primitive === "delete") {
      return {
        type: "SequenceExpression",
        expressions: [
          rebuildExpression(node.arguments[1], config),
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
        argument: rebuildExpression(node.arguments[1], config),
      };
    }
  } else if (isBinaryDesign(node)) {
    return {
      type: "BinaryExpression",
      operator: node.arguments[0].primitive,
      left: rebuildExpression(node.arguments[1], config),
      right: rebuildExpression(node.arguments[2], config),
    };
  } else if (isArrayDesign(node)) {
    return {
      type: "ArrayExpression",
      elements: map(node.arguments, (child) =>
        rebuildExpression(child, config),
      ),
    };
  } else if (isObjectDesign(node)) {
    return {
      type: "ObjectExpression",
      properties: concatXX(
        node.arguments[0].type === "IntrinsicExpression" &&
          node.arguments[0].intrinsic === "Object.prototype"
          ? []
          : [
              {
                type: "Property",
                shorthand: false,
                kind: "init",
                method: false,
                computed: false,
                key: {
                  type: "Identifier",
                  name: "__proto__",
                },
                value: rebuildExpression(node.arguments[0], config),
              },
            ],
        map(
          pairupArray(slice(node.arguments, 1, node.arguments.length)),
          ({ 0: key, 1: value }) => ({
            type: "Property",
            shorthand: false,
            kind: "init",
            method: false,
            computed: true,
            key: rebuildExpression(key, config),
            value: rebuildExpression(value, config),
          }),
        ),
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
              argument: mangleParameter("function.arguments", config),
            },
          ],
          body: {
            type: "BlockStatement",
            body: [
              {
                type: "VariableDeclaration",
                kind: "let",
                declarations: [
                  {
                    type: "VariableDeclarator",
                    id: mangleParameter("new.target", config),
                    init: NEW_TARGET,
                  },
                  {
                    type: "VariableDeclarator",
                    id: mangleParameter("this", config),
                    init: {
                      type: "ConditionalExpression",
                      test: NEW_TARGET,
                      // TODO: decide whether aran.deadzone is better here
                      consequent: {
                        type: "UnaryExpression",
                        prefix: true,
                        operator: "void",
                        argument: {
                          type: "Literal",
                          value: 0,
                        },
                      },
                      alternate: {
                        type: "ThisExpression",
                      },
                    },
                  },
                ],
              },
              ...rebuildClosureBlock(node.body, config, {
                completion: "return",
              }),
            ],
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
              argument: mangleParameter("function.arguments", config),
            },
          ],
          body: {
            type: "BlockStatement",
            body: rebuildClosureBlock(node.body, config, {
              completion: "return",
            }),
          },
        };
      }
      case "PrimitiveExpression": {
        return makePrimitiveExpression(node.primitive);
      }
      case "IntrinsicExpression": {
        return makeIntrinsicExpression(node.intrinsic, config);
      }
      case "ReadExpression": {
        return isParameter(node.variable)
          ? mangleParameter(node.variable, config)
          : mangleVariable(node.variable, config);
      }
      case "ImportExpression": {
        return mangleImport(node.source, node.import, config);
      }
      case "AwaitExpression": {
        return {
          type: "AwaitExpression",
          argument: rebuildExpression(node.promise, config),
        };
      }
      case "YieldExpression": {
        return {
          type: "YieldExpression",
          delegate: node.delegate,
          argument: rebuildExpression(node.item, config),
        };
      }
      case "ConditionalExpression": {
        return {
          type: "ConditionalExpression",
          test: rebuildExpression(node.test, config),
          consequent: rebuildExpression(node.consequent, config),
          alternate: rebuildExpression(node.alternate, config),
        };
      }
      case "SequenceExpression": {
        return {
          type: "SequenceExpression",
          expressions: [
            ...flatMap(node.head, (node) =>
              extractSequence(rebuildEffect(node, config)),
            ),
            ...extractSequence(rebuildExpression(node.tail, config)),
          ],
        };
      }
      case "EvalExpression": {
        return {
          type: "CallExpression",
          optional: false,
          // TODO flags if eval changed
          callee: EVAL_IDENTIFIER,
          arguments: [rebuildExpression(node.code, config)],
        };
      }
      case "ConstructExpression": {
        return {
          type: "NewExpression",
          callee: rebuildExpression(node.callee, config),
          arguments: map(node.arguments, (child) =>
            rebuildExpression(child, config),
          ),
        };
      }
      case "ApplyExpression": {
        if (
          node.this.type === "IntrinsicExpression" &&
          node.this.intrinsic === "undefined"
        ) {
          return {
            type: "CallExpression",
            optional: false,
            callee: sanitizeMemberExpression(
              rebuildExpression(node.callee, config),
            ),
            arguments: map(node.arguments, (child) =>
              rebuildExpression(child, config),
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
              object: rebuildExpression(node.callee.arguments[0], config),
              property: rebuildExpression(node.callee.arguments[1], config),
            },
            arguments: map(node.arguments, (child) =>
              rebuildExpression(child, config),
            ),
          };
        } else {
          return {
            type: "CallExpression",
            optional: false,
            callee: makeIntrinsicExpression("Reflect.apply", config),
            arguments: [
              rebuildExpression(node.callee, config),
              rebuildExpression(node.this, config),
              {
                type: "ArrayExpression",
                elements: map(node.arguments, (child) =>
                  rebuildExpression(child, config),
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
