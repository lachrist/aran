/* eslint-disable no-use-before-define */
import {
  map,
  flatMap,
  slice,
  pairupArray,
  concatXX,
  concatXXX,
  concatX_,
  filter,
  concat_XX,
  concatXXXXX,
  concatXX_,
} from "../util/index.mjs";
import { isBigIntPrimitive, isParameter, unpackPrimitive } from "../lang.mjs";
import {
  mangleParameter,
  mangleImport,
  mangleVariable,
  EVAL_IDENTIFIER,
  NEW_TARGET,
} from "./mangle.mjs";
import { AranTypeError } from "../error.mjs";
import { rebuildEffect } from "./effect.mjs";
import {
  isArrayDesign,
  isBinaryDesign,
  isMemberDesign,
  isObjectDesign,
  isUnaryDesign,
} from "./design.mjs";
import { makeIntrinsicExpression } from "./intrinsic.mjs";
import { hasParameter } from "../query.mjs";
import { rebuildStatement } from "./statement.mjs";
import { listDeclaration } from "./declaration.mjs";

const { BigInt } = globalThis;

/** @type {(node: import("../estree").Expression) => import("../estree").Expression} */
const sanitizeMemberExpression = (node) =>
  node.type === "MemberExpression"
    ? {
        type: "SequenceExpression",
        expressions: [{ type: "Literal", value: null }, node],
      }
    : node;

/**
 * @type {(
 *   binding: [
 *     import("./atom").Variable,
 *     import("../lang").Intrinsic,
 *   ],
 * ) => boolean}
 */
const isBindingDefined = ([_variable, intrinsic]) => intrinsic !== "undefined";

/**
 * @type {(
 *   parameter: "new.target" | "this" | "function.arguments",
 *   config: import("./config").Config,
 * ) => import("estree").Expression}
 */
const makeGeneratorParameterInitial = (parameter, config) => {
  switch (parameter) {
    case "new.target": {
      return {
        type: "UnaryExpression",
        prefix: true,
        operator: "void",
        argument: {
          type: "Literal",
          value: 0,
        },
      };
    }
    case "this": {
      return {
        type: "ThisExpression",
      };
    }
    case "function.arguments": {
      return {
        type: "CallExpression",
        optional: false,
        callee: makeIntrinsicExpression("Array.from", config),
        arguments: [
          {
            type: "Identifier",
            name: "arguments",
          },
        ],
      };
    }
    default: {
      throw new AranTypeError(parameter);
    }
  }
};

/**
 * @type {(
 *   parameter: "new.target" | "this" | "function.arguments",
 *   config: import("./config").Config,
 * ) => import("estree").Property}
 */
const makeGeneratorParameterInitialProperty = (parameter, config) => ({
  type: "Property",
  kind: "init",
  method: false,
  shorthand: false,
  computed: false,
  key: {
    type: "Literal",
    value: parameter,
  },
  value: makeGeneratorParameterInitial(parameter, config),
});

/**
 * @type {(
 *   parameter: "new.target" | "this" | "function.arguments",
 *   config: import("./config").Config,
 * ) => import("estree").AssignmentProperty}
 */
const makeGeneratorParameterBindingProperty = (parameter, config) => ({
  type: "Property",
  kind: "init",
  method: false,
  shorthand: false,
  computed: false,
  key: {
    type: "Literal",
    value: parameter,
  },
  value: mangleParameter(parameter, config),
});

/**
 * @type {(
 *   binding: [
 *     import("./atom").Variable,
 *     import("../lang").Intrinsic,
 *   ],
 *   config: import("./config").Config,
 * ) => import("estree").Property}
 */
const makeGeneratorVariableInitialProperty = (
  [variable, intrinsic],
  config,
) => ({
  type: "Property",
  kind: "init",
  method: false,
  shorthand: false,
  computed: false,
  key: {
    type: "Literal",
    value: variable,
  },
  value: makeIntrinsicExpression(intrinsic, config),
});

/**
 * @type {(
 *   variable: import("./atom").Variable,
 *   config: import("./config").Config,
 * ) => import("estree").AssignmentProperty}
 */
const makeGeneratorVariableBindingProperty = (variable, config) => ({
  type: "Property",
  kind: "init",
  method: false,
  shorthand: false,
  computed: false,
  key: {
    type: "Literal",
    value: variable,
  },
  value: mangleVariable(variable, config),
});

/**
 * @type {(
 *   node: import("./atom").Expression & {
 *     type: "ClosureExpression",
 *   },
 *   config: import("./config").Config,
 * ) => import("../estree").Expression}
 */
const rebuildClosure = (node, config) => {
  switch (node.kind) {
    case "function": {
      return {
        type: "FunctionExpression",
        id: null,
        async: node.asynchronous,
        generator: false,
        params: hasParameter(node.body, "function.arguments")
          ? [
              {
                type: "RestElement",
                argument: mangleParameter("function.arguments", config),
              },
            ]
          : [],
        body: {
          type: "BlockStatement",
          body: concatXXXXX(
            hasParameter(node.body, "new.target")
              ? [
                  {
                    type: "VariableDeclaration",
                    kind: "let",
                    declarations: [
                      {
                        type: "VariableDeclarator",
                        id: mangleParameter("new.target", config),
                        init: NEW_TARGET,
                      },
                    ],
                  },
                ]
              : [],
            hasParameter(node.body, "this")
              ? [
                  {
                    type: "VariableDeclaration",
                    kind: "let",
                    declarations: [
                      {
                        type: "VariableDeclarator",
                        id: mangleParameter("this", config),
                        init: {
                          type: "ConditionalExpression",
                          test: NEW_TARGET,
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
                ]
              : [],
            listDeclaration(node.body.bindings, config),
            map(node.body.body, (child) => rebuildStatement(child, config)),
            [
              {
                type: "ReturnStatement",
                argument: rebuildExpression(node.body.tail, config),
              },
            ],
          ),
        },
      };
    }
    case "arrow": {
      return {
        type: "ArrowFunctionExpression",
        async: node.asynchronous,
        expression: false,
        params: hasParameter(node.body, "function.arguments")
          ? [
              {
                type: "RestElement",
                argument: mangleParameter("function.arguments", config),
              },
            ]
          : [],
        body: {
          type: "BlockStatement",
          body: concatXX_(
            listDeclaration(node.body.bindings, config),
            map(node.body.body, (child) => rebuildStatement(child, config)),
            {
              type: "ReturnStatement",
              argument: rebuildExpression(node.body.tail, config),
            },
          ),
        },
      };
    }
    case "method": {
      return {
        type: "MemberExpression",
        optional: false,
        computed: false,
        object: {
          type: "ObjectExpression",
          properties: [
            {
              type: "Property",
              kind: "init",
              method: true,
              shorthand: false,
              computed: false,
              key: {
                type: "Identifier",
                name: "method",
              },
              value: {
                type: "FunctionExpression",
                id: null,
                async: node.asynchronous,
                generator: false,
                params: hasParameter(node.body, "function.arguments")
                  ? [
                      {
                        type: "RestElement",
                        argument: mangleParameter("function.arguments", config),
                      },
                    ]
                  : [],
                body: {
                  type: "BlockStatement",
                  body: concatXXXXX(
                    hasParameter(node.body, "new.target")
                      ? [
                          {
                            type: "VariableDeclaration",
                            kind: "let",
                            declarations: [
                              {
                                type: "VariableDeclarator",
                                id: mangleParameter("new.target", config),
                                init: {
                                  type: "UnaryExpression",
                                  prefix: true,
                                  operator: "void",
                                  argument: {
                                    type: "Literal",
                                    value: 0,
                                  },
                                },
                              },
                            ],
                          },
                        ]
                      : [],
                    hasParameter(node.body, "this")
                      ? [
                          {
                            type: "VariableDeclaration",
                            kind: "let",
                            declarations: [
                              {
                                type: "VariableDeclarator",
                                id: mangleParameter("this", config),
                                init: {
                                  type: "ThisExpression",
                                },
                              },
                            ],
                          },
                        ]
                      : [],
                    listDeclaration(node.body.bindings, config),
                    map(node.body.body, (child) =>
                      rebuildStatement(child, config),
                    ),
                    [
                      {
                        type: "ReturnStatement",
                        argument: rebuildExpression(node.body.tail, config),
                      },
                    ],
                  ),
                },
              },
            },
          ],
        },
        property: {
          type: "Identifier",
          name: "method",
        },
      };
    }
    case "generator": {
      const parameters = concatXXX(
        hasParameter(node.body, "function.arguments")
          ? [/** @type {"function.arguments"} */ ("function.arguments")]
          : [],
        hasParameter(node.body, "new.target")
          ? [/** @type {"new.target"} */ ("new.target")]
          : [],
        hasParameter(node.body, "this") ? [/** @type {"this"} */ ("this")] : [],
      );
      return {
        type: "FunctionExpression",
        async: node.asynchronous,
        generator: true,
        params: [
          {
            type: "RestElement",
            argument: {
              type: "ObjectPattern",
              properties: concatXX(
                node.body.bindings.length === 0 && parameters.length === 0
                  ? []
                  : [
                      {
                        type: "Property",
                        kind: "init",
                        method: false,
                        shorthand: false,
                        computed: true,
                        key: {
                          type: "CallExpression",
                          optional: false,
                          callee: makeIntrinsicExpression("Symbol", config),
                          arguments: [
                            {
                              type: "Literal",
                              value: "fresh-key",
                            },
                          ],
                        },
                        value: {
                          type: "AssignmentPattern",
                          left: {
                            type: "ObjectPattern",
                            properties: concatXX(
                              map(parameters, (parameter) =>
                                makeGeneratorParameterBindingProperty(
                                  parameter,
                                  config,
                                ),
                              ),
                              map(
                                node.body.bindings,
                                ([variable, _intrinsic]) =>
                                  makeGeneratorVariableBindingProperty(
                                    variable,
                                    config,
                                  ),
                              ),
                            ),
                          },
                          right: {
                            type: "ObjectExpression",
                            properties: concat_XX(
                              {
                                type: "Property",
                                kind: "init",
                                method: false,
                                shorthand: false,
                                computed: false,
                                key: {
                                  type: "Literal",
                                  value: "__proto__",
                                },
                                value: {
                                  type: "Literal",
                                  value: null,
                                },
                              },
                              map(parameters, (parameter) =>
                                makeGeneratorParameterInitialProperty(
                                  parameter,
                                  config,
                                ),
                              ),
                              map(
                                filter(node.body.bindings, isBindingDefined),
                                (binding) =>
                                  makeGeneratorVariableInitialProperty(
                                    binding,
                                    config,
                                  ),
                              ),
                            ),
                          },
                        },
                      },
                    ],
                node.body.head.length === 0
                  ? []
                  : [
                      {
                        type: "Property",
                        kind: "init",
                        method: false,
                        shorthand: false,
                        computed: true,
                        key: {
                          type: "CallExpression",
                          optional: false,
                          callee: makeIntrinsicExpression("Symbol", config),
                          arguments: [
                            {
                              type: "Literal",
                              value: "fresh-key",
                            },
                          ],
                        },
                        value: {
                          type: "AssignmentPattern",
                          left: {
                            type: "ObjectPattern",
                            properties: [],
                          },
                          right: {
                            type: "SequenceExpression",
                            expressions: concatX_(
                              map(node.body.head, (child) =>
                                rebuildEffect(child, config),
                              ),
                              {
                                type: "ObjectExpression",
                                properties: [],
                              },
                            ),
                          },
                        },
                      },
                    ],
              ),
            },
          },
        ],
        body: {
          type: "BlockStatement",
          body: concatX_(
            map(node.body.body, (child) => rebuildStatement(child, config)),
            {
              type: "ReturnStatement",
              argument: rebuildExpression(node.body.tail, config),
            },
          ),
        },
      };
    }
    default: {
      throw new AranTypeError(node);
    }
  }
};

/**
 * @type {(
 * node1: import("./atom").Expression,
 * node2: import("./atom").Expression,
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

/** @type {(node: import("../estree").Expression) => import("../estree").Expression[]} */
const extractSequence = (node) =>
  node.type === "SequenceExpression" ? node.expressions : [node];

/**
 * @type {(
 *   node: import("./atom").Expression,
 *   config: import("./config").Config,
 * ) => import("../estree").Expression}
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
      case "ClosureExpression": {
        const self = rebuildClosure(node, config);
        if (hasParameter(node.body, "function.callee")) {
          return {
            type: "CallExpression",
            optional: false,
            callee: {
              type: "ArrowFunctionExpression",
              params: [mangleParameter("function.callee", config)],
              async: false,
              expression: true,
              body: {
                type: "AssignmentExpression",
                left: mangleParameter("function.callee", config),
                operator: "=",
                right: self,
              },
            },
            arguments: [],
          };
        } else {
          return self;
        }
      }
      case "PrimitiveExpression": {
        if (isBigIntPrimitive(node.primitive)) {
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
          (node.callee.this.type === "PrimitiveExpression" ||
            node.callee.this.type === "IntrinsicExpression") &&
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
