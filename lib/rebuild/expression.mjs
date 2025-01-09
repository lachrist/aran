/* eslint-disable no-use-before-define */
import {
  map,
  slice,
  pairupArray,
  concatXX,
  concatX_,
  filter,
  concat_XX,
  flatenTree,
} from "../util/index.mjs";
import {
  hasParameter,
  isBigIntPrimitive,
  isParameter,
  unpackPrimitive,
} from "../lang/index.mjs";
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
import { rebuildStatement } from "./statement.mjs";
import { listDeclaration } from "./declaration.mjs";
import {
  makeBigIntLiteral,
  makePublicKeyLiteral,
  makeSimpleLiteral,
} from "./literal.mjs";

/**
 * @type {(
 *   node: import("estree-sentry").Expression<{}>,
 * ) => import("estree-sentry").Expression<{}>}
 */
const sanitizeMemberExpression = (node) =>
  node.type === "MemberExpression"
    ? {
        type: "SequenceExpression",
        expressions: [makeSimpleLiteral(null), node],
      }
    : node;

/**
 * @type {(
 *   binding: [
 *     import("./atom").Variable,
 *     import("../lang/syntax").Intrinsic,
 *   ],
 * ) => boolean}
 */
const isBindingDefined = ([_variable, intrinsic]) => intrinsic !== "undefined";

/**
 * @type {(
 *   parameter: "new.target" | "this" | "function.arguments",
 *   config: import("./config").Config,
 * ) => import("estree-sentry").Expression<{}>}
 */
const makeGeneratorParameterInitial = (parameter, config) => {
  switch (parameter) {
    case "new.target": {
      return {
        type: "UnaryExpression",
        prefix: true,
        operator: "void",
        argument: makeSimpleLiteral(null),
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
            name: /** @type {import("estree-sentry").VariableName} */ (
              "arguments"
            ),
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
 * ) => import("estree-sentry").ObjectProperty<{}>}
 */
const makeGeneratorParameterInitialProperty = (parameter, config) => ({
  type: "Property",
  kind: "init",
  method: false,
  shorthand: false,
  computed: false,
  key: makePublicKeyLiteral(parameter),
  value: makeGeneratorParameterInitial(parameter, config),
});

/**
 * @type {(
 *   parameter: "new.target" | "this" | "function.arguments",
 *   config: import("./config").Config,
 * ) => import("estree-sentry").PatternProperty<{}>}
 */
const makeGeneratorParameterBindingProperty = (parameter, config) => ({
  type: "Property",
  kind: "init",
  method: false,
  shorthand: false,
  computed: true,
  key: makeSimpleLiteral(parameter),
  value: mangleParameter(parameter, config),
});

/**
 * @type {(
 *   binding: [
 *     import("./atom").Variable,
 *     import("../lang/syntax").Intrinsic,
 *   ],
 *   config: import("./config").Config,
 * ) => import("estree-sentry").ObjectProperty<{}>}
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
  key: makePublicKeyLiteral(variable),
  value: makeIntrinsicExpression(intrinsic, config),
});

/**
 * @type {(
 *   variable: import("./atom").Variable,
 *   config: import("./config").Config,
 * ) => import("estree-sentry").PatternProperty<{}>}
 */
const makeGeneratorVariableBindingProperty = (variable, config) => ({
  type: "Property",
  kind: "init",
  method: false,
  shorthand: false,
  computed: true,
  key: makeSimpleLiteral(variable),
  value: mangleVariable(variable, config),
});

/**
 * @type {(
 *   node: import("./atom").Expression & {
 *     type: "ClosureExpression",
 *   },
 *   config: import("./config").Config,
 * ) => import("estree-sentry").Expression<{}>}
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
          body: flatenTree([
            hasParameter(node.body, "new.target")
              ? {
                  type: "VariableDeclaration",
                  kind: "let",
                  declarations: [
                    {
                      type: "VariableDeclarator",
                      id: mangleParameter("new.target", config),
                      init: NEW_TARGET,
                    },
                  ],
                }
              : null,
            hasParameter(node.body, "this")
              ? {
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
                          argument: makeSimpleLiteral(null),
                        },
                        alternate: {
                          type: "ThisExpression",
                        },
                      },
                    },
                  ],
                }
              : null,
            listDeclaration(node.body.bindings, config),
            map(node.body.body, (child) => rebuildStatement(child, config)),
            {
              type: "ReturnStatement",
              argument: rebuildExpression(node.body.tail, config),
            },
          ]),
        },
      };
    }
    case "arrow": {
      return {
        type: "ArrowFunctionExpression",
        id: null,
        async: node.asynchronous,
        generator: false,
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
          body: flatenTree([
            listDeclaration(node.body.bindings, config),
            map(node.body.body, (child) => rebuildStatement(child, config)),
            {
              type: "ReturnStatement",
              argument: rebuildExpression(node.body.tail, config),
            },
          ]),
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
                name: /** @type {import("estree-sentry").PublicKeyName} */ (
                  "method"
                ),
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
                  body: flatenTree([
                    hasParameter(node.body, "new.target")
                      ? {
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
                                argument: makeSimpleLiteral(null),
                              },
                            },
                          ],
                        }
                      : null,
                    hasParameter(node.body, "this")
                      ? {
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
                        }
                      : null,
                    listDeclaration(node.body.bindings, config),
                    map(node.body.body, (child) =>
                      rebuildStatement(child, config),
                    ),
                    {
                      type: "ReturnStatement",
                      argument: rebuildExpression(node.body.tail, config),
                    },
                  ]),
                },
              },
            },
          ],
        },
        property: {
          type: "Identifier",
          name: /** @type {import("estree-sentry").PublicKeyName} */ ("method"),
        },
      };
    }
    case "generator": {
      const parameters = flatenTree([
        hasParameter(node.body, "function.arguments")
          ? /** @type {"function.arguments"} */ ("function.arguments")
          : null,
        hasParameter(node.body, "new.target")
          ? /** @type {"new.target"} */ ("new.target")
          : null,
        hasParameter(node.body, "this") ? /** @type {"this"} */ ("this") : null,
      ]);
      return {
        type: "FunctionExpression",
        id: null,
        async: node.asynchronous,
        generator: true,
        params: [
          {
            type: "RestElement",
            argument: {
              type: "ObjectPattern",
              properties: flatenTree([
                node.body.bindings.length === 0 && parameters.length === 0
                  ? null
                  : {
                      type: "Property",
                      kind: "init",
                      method: false,
                      shorthand: false,
                      computed: true,
                      key: {
                        type: "CallExpression",
                        optional: false,
                        callee: makeIntrinsicExpression("Symbol", config),
                        arguments: [makeSimpleLiteral("fresh-key")],
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
                            map(node.body.bindings, ([variable, _intrinsic]) =>
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
                                type: "Identifier",
                                name: /** @type {import("estree-sentry").PublicKeyName} */ (
                                  "__proto__"
                                ),
                              },
                              value: makeSimpleLiteral(null),
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
                node.body.head.length === 0
                  ? null
                  : {
                      type: "Property",
                      kind: "init",
                      method: false,
                      shorthand: false,
                      computed: true,
                      key: {
                        type: "CallExpression",
                        optional: false,
                        callee: makeIntrinsicExpression("Symbol", config),
                        arguments: [makeSimpleLiteral("fresh-key")],
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
              ]),
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

/**
 * @type {(
 *   node: import("estree-sentry").Expression<{}>,
 * ) => import("../util/tree").Tree<import("estree-sentry").Expression<{}>>}
 */
const extractSequence = (node) =>
  node.type === "SequenceExpression" ? node.expressions : node;

/**
 * @type {(
 *   node: import("./atom").Expression,
 *   config: import("./config").Config,
 * ) => import("estree-sentry").Expression<{}>}
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
          makeSimpleLiteral(null),
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
      operator: /** @type {any} */ (node.arguments[0].primitive),
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
                  name: /** @type {import("estree-sentry").PublicKeyName} */ (
                    "__proto__"
                  ),
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
              id: null,
              generator: false,
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
          return makeBigIntLiteral(
            /** @type {import("estree-sentry").BigIntRepresentation} */ (
              node.primitive.bigint
            ),
          );
        } else {
          return makeSimpleLiteral(node.primitive);
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
          expressions: flatenTree([
            map(node.head, (node) =>
              extractSequence(rebuildEffect(node, config)),
            ),
            extractSequence(rebuildExpression(node.tail, config)),
          ]),
        };
      }
      case "EvalExpression": {
        return {
          type: "CallExpression",
          optional: false,
          // TODO flags if eval changed
          callee: EVAL_IDENTIFIER,
          arguments: [
            {
              type: "CallExpression",
              callee: makeIntrinsicExpression("aran.rebuild", config),
              optional: false,
              arguments: [rebuildExpression(node.code, config)],
            },
          ],
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
