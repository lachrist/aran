import { AranTypeError } from "../error.mjs";
import { getParameterFunctionName } from "../lang/index.mjs";
import { makeSimpleLiteral } from "./literal.mjs";
import { mangleParameter } from "./mangle.mjs";

const CACHE_VARIABLE = /** @type {import("estree-sentry").VariableName} */ (
  "__ARAN_CACHE__"
);

const VARIABLE_VARIABLE = /** @type {import("estree-sentry").VariableName} */ (
  "__ARAN_VARIABLE__"
);

const ADDITIONAL_VARIABLE =
  /** @type {import("estree-sentry").VariableName} */ ("__ARAN_ADDITIONAL__");

const OPTIMIZATION_VARIABLE =
  /** @type {import("estree-sentry").VariableName} */ ("__ARAN_OPTIMIZATION__");

/**
 * @type {(
 *   parameter: import("./parameter-scope").ScopeParameter,
 * ) => import("estree-sentry").Expression<{}>}
 */
const makeCodeExpression = (parameter) => {
  switch (parameter) {
    case "scope.read": {
      return {
        type: "BinaryExpression",
        operator: "+",
        left: makeSimpleLiteral(`((${ADDITIONAL_VARIABLE}) => (`),
        right: {
          type: "BinaryExpression",
          operator: "+",
          left: {
            type: "Identifier",
            name: VARIABLE_VARIABLE,
          },
          right: makeSimpleLiteral("));"),
        },
      };
    }
    case "scope.writeSloppy": {
      return {
        type: "BinaryExpression",
        operator: "+",
        left: makeSimpleLiteral(`((${ADDITIONAL_VARIABLE}) => (`),
        right: {
          type: "BinaryExpression",
          operator: "+",
          left: {
            type: "Identifier",
            name: VARIABLE_VARIABLE,
          },
          right: makeSimpleLiteral(`= ${ADDITIONAL_VARIABLE}));`),
        },
      };
    }
    case "scope.writeStrict": {
      return {
        type: "BinaryExpression",
        operator: "+",
        left: makeSimpleLiteral(`((${ADDITIONAL_VARIABLE}) => (`),
        right: {
          type: "BinaryExpression",
          operator: "+",
          left: {
            type: "Identifier",
            name: VARIABLE_VARIABLE,
          },
          right: makeSimpleLiteral(`= ${ADDITIONAL_VARIABLE}));`),
        },
      };
    }
    case "scope.typeof": {
      return {
        type: "BinaryExpression",
        operator: "+",
        left: makeSimpleLiteral(`((${ADDITIONAL_VARIABLE}) => (typeof `),
        right: {
          type: "BinaryExpression",
          operator: "+",
          left: {
            type: "Identifier",
            name: VARIABLE_VARIABLE,
          },
          right: makeSimpleLiteral("));"),
        },
      };
    }
    case "scope.discard": {
      return {
        type: "BinaryExpression",
        operator: "+",
        left: makeSimpleLiteral(`((${ADDITIONAL_VARIABLE}) => (delete `),
        right: {
          type: "BinaryExpression",
          operator: "+",
          left: {
            type: "Identifier",
            name: VARIABLE_VARIABLE,
          },
          right: makeSimpleLiteral("));"),
        },
      };
    }
    default: {
      throw new AranTypeError(parameter);
    }
  }
};

/**
 * @type {(
 *   parameter: import("./parameter-scope").ScopeParameter,
 * ) => import("estree-sentry").Expression<{}>}
 */
const makeArrowExpression = (parameter) => ({
  type: "CallExpression",
  optional: false,
  callee: {
    type: "ArrowFunctionExpression",
    id: null,
    async: false,
    generator: false,
    expression: true,
    params: [
      {
        type: "Identifier",
        name: CACHE_VARIABLE,
      },
    ],
    body: {
      type: "FunctionExpression",
      id: {
        type: "Identifier",
        name: getParameterFunctionName(parameter),
      },
      async: false,
      generator: false,
      params: [
        {
          type: "Identifier",
          name: VARIABLE_VARIABLE,
        },
        {
          type: "Identifier",
          name: ADDITIONAL_VARIABLE,
        },
        {
          type: "Identifier",
          name: OPTIMIZATION_VARIABLE,
        },
      ],
      body: {
        type: "BlockStatement",
        body: [
          {
            type: "ReturnStatement",
            argument: {
              type: "ConditionalExpression",
              test: {
                type: "Identifier",
                name: OPTIMIZATION_VARIABLE,
              },
              consequent: {
                type: "AssignmentExpression",
                operator: "=",
                left: {
                  type: "MemberExpression",
                  computed: true,
                  optional: false,
                  object: {
                    type: "Identifier",
                    name: CACHE_VARIABLE,
                  },
                  property: {
                    type: "Identifier",
                    name: VARIABLE_VARIABLE,
                  },
                },
                right: {
                  type: "Identifier",
                  name: OPTIMIZATION_VARIABLE,
                },
              },
              alternate: {
                type: "LogicalExpression",
                operator: "??",
                left: {
                  type: "MemberExpression",
                  computed: true,
                  optional: false,
                  object: {
                    type: "Identifier",
                    name: CACHE_VARIABLE,
                  },
                  property: {
                    type: "Identifier",
                    name: VARIABLE_VARIABLE,
                  },
                },
                right: {
                  type: "AssignmentExpression",
                  operator: "=",
                  left: {
                    type: "MemberExpression",
                    computed: true,
                    optional: false,
                    object: {
                      type: "Identifier",
                      name: CACHE_VARIABLE,
                    },
                    property: {
                      type: "Identifier",
                      name: VARIABLE_VARIABLE,
                    },
                  },
                  // TODO check eval identity
                  // TODO check variable clash
                  right: {
                    type: "CallExpression",
                    optional: false,
                    callee: {
                      type: "Identifier",
                      name: /** @type {import("estree-sentry").VariableName} */ (
                        "eval"
                      ),
                    },
                    arguments: [makeCodeExpression(parameter)],
                  },
                },
              },
            },
          },
        ],
      },
    },
  },
  arguments: [
    {
      type: "ObjectExpression",
      properties: [
        {
          type: "Property",
          computed: false,
          shorthand: false,
          kind: "init",
          method: false,
          key: {
            type: "Identifier",
            name: /** @type {import("estree-sentry").PublicKeyName} */ (
              "__proto__"
            ),
          },
          value: makeSimpleLiteral(null),
        },
      ],
    },
  ],
});

/**
 * @type {(
 *   parameter: import("./parameter-scope").ScopeParameter,
 *   config: import("./config-internal").InternalConfig,
 * ) => import("estree-sentry").Statement<{}>}
 */
export const makeScopeParameterDeclaration = (parameter, config) => ({
  type: "VariableDeclaration",
  kind: "let",
  declarations: [
    {
      type: "VariableDeclarator",
      id: mangleParameter(parameter, config),
      init: makeArrowExpression(parameter),
    },
  ],
});
