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
  mangleSelfClosure,
} from "./mangle.mjs";
import { AranTypeError } from "../error.mjs";
import { retroEffect } from "./effect.mjs";
import {
  isArrayDesign,
  isBinaryDesign,
  isMemberDesign,
  isObjectDesign,
  isUnaryDesign,
} from "./design.mjs";
import {
  makeAmbientIntrinsicExpression,
  makeArbitraryIntrinsicExpression,
} from "./intrinsic.mjs";
import { retroStatement } from "./statement.mjs";
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
 *     import("./atom.d.ts").Variable,
 *     import("../lang/syntax.d.ts").Intrinsic,
 *   ],
 * ) => boolean}
 */
const isBindingDefined = ([_variable, intrinsic]) => intrinsic !== "undefined";

/**
 * @type {(
 *   parameter: "function.callee" | "new.target" | "this" | "function.arguments",
 *   config: import("./config-internal.d.ts").InternalConfig,
 * ) => import("estree-sentry").Expression<{}>}
 */
const makeGeneratorParameterInitial = (parameter, config) => {
  switch (parameter) {
    case "function.callee": {
      return mangleSelfClosure(config);
    }
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
        callee: makeAmbientIntrinsicExpression("Array.from", config),
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
 *   parameter: "function.callee" | "new.target" | "this" | "function.arguments",
 *   config: import("./config-internal.d.ts").InternalConfig,
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
 *   parameter: "function.callee" | "new.target" | "this" | "function.arguments",
 *   config: import("./config-internal.d.ts").InternalConfig,
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
 *     import("./atom.d.ts").Variable,
 *     import("../lang/syntax.d.ts").Intrinsic,
 *   ],
 *   config: import("./config-internal.d.ts").InternalConfig,
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
  value: makeArbitraryIntrinsicExpression(intrinsic, config),
});

/**
 * @type {(
 *   variable: import("./atom.d.ts").Variable,
 *   config: import("./config-internal.d.ts").InternalConfig,
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
 *   node: import("./atom.d.ts").Expression & {
 *     type: "ClosureExpression",
 *   },
 *   config: import("./config-internal.d.ts").InternalConfig,
 * ) => import("estree-sentry").Expression<{}>}
 */
const retroClosure = (node, config) => {
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
            hasParameter(node.body, "function.callee")
              ? {
                  type: "VariableDeclaration",
                  kind: "let",
                  declarations: [
                    {
                      type: "VariableDeclarator",
                      id: mangleParameter("function.callee", config),
                      init: mangleSelfClosure(config),
                    },
                  ],
                }
              : null,
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
            map(node.body.body, (child) => retroStatement(child, config)),
            {
              type: "ReturnStatement",
              argument: retroExpression(node.body.tail, config),
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
            hasParameter(node.body, "function.callee")
              ? {
                  type: "VariableDeclaration",
                  kind: "let",
                  declarations: [
                    {
                      type: "VariableDeclarator",
                      id: mangleParameter("function.callee", config),
                      init: mangleSelfClosure(config),
                    },
                  ],
                }
              : null,
            listDeclaration(node.body.bindings, config),
            map(node.body.body, (child) => retroStatement(child, config)),
            {
              type: "ReturnStatement",
              argument: retroExpression(node.body.tail, config),
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
                    hasParameter(node.body, "function.callee")
                      ? {
                          type: "VariableDeclaration",
                          kind: "let",
                          declarations: [
                            {
                              type: "VariableDeclarator",
                              id: mangleParameter("function.callee", config),
                              init: mangleSelfClosure(config),
                            },
                          ],
                        }
                      : null,
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
                      retroStatement(child, config),
                    ),
                    {
                      type: "ReturnStatement",
                      argument: retroExpression(node.body.tail, config),
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
        hasParameter(node.body, "function.callee")
          ? /** @type {"function.callee"} */ ("function.callee")
          : null,
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
                        callee: makeAmbientIntrinsicExpression(
                          "Symbol",
                          config,
                        ),
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
                        callee: makeAmbientIntrinsicExpression(
                          "Symbol",
                          config,
                        ),
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
                              retroEffect(child, config),
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
            map(node.body.body, (child) => retroStatement(child, config)),
            {
              type: "ReturnStatement",
              argument: retroExpression(node.body.tail, config),
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
 * node1: import("./atom.d.ts").Expression,
 * node2: import("./atom.d.ts").Expression,
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
 * ) => import("../util/tree.d.ts").Tree<import("estree-sentry").Expression<{}>>}
 */
const extractSequence = (node) =>
  node.type === "SequenceExpression" ? node.expressions : node;

/**
 * @type {(
 *   node: import("./atom.d.ts").Expression,
 *   config: import("./config-internal.d.ts").InternalConfig,
 * ) => import("estree-sentry").Expression<{}>}
 */
export const retroExpression = (node, config) => {
  if (isMemberDesign(node)) {
    return {
      type: "MemberExpression",
      optional: false,
      computed: true,
      object: retroExpression(node.arguments[0], config),
      property: retroExpression(node.arguments[1], config),
    };
  } else if (isUnaryDesign(node)) {
    if (node.arguments[0].primitive === "delete") {
      return {
        type: "SequenceExpression",
        expressions: [
          retroExpression(node.arguments[1], config),
          makeSimpleLiteral(null),
        ],
      };
    } else {
      return {
        type: "UnaryExpression",
        operator: node.arguments[0].primitive,
        prefix: true,
        argument: retroExpression(node.arguments[1], config),
      };
    }
  } else if (isBinaryDesign(node)) {
    return {
      type: "BinaryExpression",
      operator: /** @type {any} */ (node.arguments[0].primitive),
      left: retroExpression(node.arguments[1], config),
      right: retroExpression(node.arguments[2], config),
    };
  } else if (isArrayDesign(node)) {
    return {
      type: "ArrayExpression",
      elements: map(node.arguments, (child) => retroExpression(child, config)),
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
                value: retroExpression(node.arguments[0], config),
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
            key: retroExpression(key, config),
            value: retroExpression(value, config),
          }),
        ),
      ),
    };
  } else {
    switch (node.type) {
      case "ClosureExpression": {
        const self = retroClosure(node, config);
        if (hasParameter(node.body, "function.callee")) {
          return {
            type: "CallExpression",
            optional: false,
            callee: {
              type: "ArrowFunctionExpression",
              id: null,
              generator: false,
              params: [mangleSelfClosure(config)],
              async: false,
              expression: true,
              body: {
                type: "AssignmentExpression",
                left: mangleSelfClosure(config),
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
        return makeArbitraryIntrinsicExpression(node.intrinsic, config);
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
          argument: retroExpression(node.promise, config),
        };
      }
      case "YieldExpression": {
        return {
          type: "YieldExpression",
          delegate: node.delegate,
          argument: retroExpression(node.item, config),
        };
      }
      case "ConditionalExpression": {
        return {
          type: "ConditionalExpression",
          test: retroExpression(node.test, config),
          consequent: retroExpression(node.consequent, config),
          alternate: retroExpression(node.alternate, config),
        };
      }
      case "SequenceExpression": {
        return {
          type: "SequenceExpression",
          expressions: flatenTree([
            map(node.head, (node) =>
              extractSequence(retroEffect(node, config)),
            ),
            extractSequence(retroExpression(node.tail, config)),
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
              callee: makeAmbientIntrinsicExpression(
                "aran.retropileEvalCode",
                config,
              ),
              optional: false,
              arguments: [retroExpression(node.code, config)],
            },
          ],
        };
      }
      case "ConstructExpression": {
        return {
          type: "NewExpression",
          callee: retroExpression(node.callee, config),
          arguments: map(node.arguments, (child) =>
            retroExpression(child, config),
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
              retroExpression(node.callee, config),
            ),
            arguments: map(node.arguments, (child) =>
              retroExpression(child, config),
            ),
          };
        } else if (
          node.callee.type === "ApplyExpression" &&
          node.callee.callee.type === "IntrinsicExpression" &&
          node.callee.callee.intrinsic === "aran.getValueProperty" &&
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
              object: retroExpression(node.callee.arguments[0], config),
              property: retroExpression(node.callee.arguments[1], config),
            },
            arguments: map(node.arguments, (child) =>
              retroExpression(child, config),
            ),
          };
        } else {
          return {
            type: "CallExpression",
            optional: false,
            callee: makeAmbientIntrinsicExpression("Reflect.apply", config),
            arguments: [
              retroExpression(node.callee, config),
              retroExpression(node.this, config),
              {
                type: "ArrayExpression",
                elements: map(node.arguments, (child) =>
                  retroExpression(child, config),
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
