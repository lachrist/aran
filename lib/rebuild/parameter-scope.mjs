import { AranTypeError } from "../error.mjs";
import { mangleParameter } from "./mangle.mjs";

const CACHE_VARIABLE = "__ARAN_CACHE__";

const VARIABLE_VARIABLE = "__ARAN_VARIABLE__";

const ADDITIONAL_VARIABLE = "__ARAN_ADDITIONAL__";

const OPTIMIZATION_VARIABLE = "__ARAN_OPTIMIZATION__";

/**
 * @type {(
 *   parameter: import("./parameter-scope").ScopeParameter,
 * ) => import("../estree").Expression}
 */
const makeCodeExpression = (parameter) => {
  switch (parameter) {
    case "scope.read": {
      return {
        type: "BinaryExpression",
        operator: "+",
        left: {
          type: "Literal",
          value: `((${ADDITIONAL_VARIABLE}) => (`,
        },
        right: {
          type: "BinaryExpression",
          operator: "+",
          left: {
            type: "Identifier",
            name: VARIABLE_VARIABLE,
          },
          right: {
            type: "Literal",
            value: "));",
          },
        },
      };
    }
    case "scope.writeSloppy": {
      return {
        type: "BinaryExpression",
        operator: "+",
        left: {
          type: "Literal",
          value: `((${ADDITIONAL_VARIABLE}) => (`,
        },
        right: {
          type: "BinaryExpression",
          operator: "+",
          left: {
            type: "Identifier",
            name: VARIABLE_VARIABLE,
          },
          right: {
            type: "Literal",
            value: `= ${ADDITIONAL_VARIABLE}));`,
          },
        },
      };
    }
    case "scope.writeStrict": {
      return {
        type: "BinaryExpression",
        operator: "+",
        left: {
          type: "Literal",
          value: `((${ADDITIONAL_VARIABLE}) => (`,
        },
        right: {
          type: "BinaryExpression",
          operator: "+",
          left: {
            type: "Identifier",
            name: VARIABLE_VARIABLE,
          },
          right: {
            type: "Literal",
            value: `= ${ADDITIONAL_VARIABLE}));`,
          },
        },
      };
    }
    case "scope.typeof": {
      return {
        type: "BinaryExpression",
        operator: "+",
        left: {
          type: "Literal",
          value: `((${ADDITIONAL_VARIABLE}) => (typeof `,
        },
        right: {
          type: "BinaryExpression",
          operator: "+",
          left: {
            type: "Identifier",
            name: VARIABLE_VARIABLE,
          },
          right: {
            type: "Literal",
            value: "));",
          },
        },
      };
    }
    case "scope.discard": {
      return {
        type: "BinaryExpression",
        operator: "+",
        left: {
          type: "Literal",
          value: `((${ADDITIONAL_VARIABLE}) => (delete `,
        },
        right: {
          type: "BinaryExpression",
          operator: "+",
          left: {
            type: "Identifier",
            name: VARIABLE_VARIABLE,
          },
          right: {
            type: "Literal",
            value: "));",
          },
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
 * ) => import("../estree").Expression}
 */
const makeArrowExpression = (parameter) => ({
  type: "CallExpression",
  optional: false,
  callee: {
    type: "ArrowFunctionExpression",
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
      type: "ArrowFunctionExpression",
      async: false,
      generator: false,
      expression: true,
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
            computed: false,
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
            computed: false,
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
              computed: false,
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
                name: "eval",
              },
              arguments: [makeCodeExpression(parameter)],
            },
          },
        },
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
            name: "__proto__",
          },
          value: {
            type: "Literal",
            value: null,
          },
        },
      ],
    },
  ],
});

/**
 * @type {(
 *   parameter: import("./parameter-scope").ScopeParameter,
 *   config: import("./config").Config,
 * ) => import("../estree").Statement[]}
 */
export const listScopeParameterDeclaration = (parameter, config) => [
  {
    type: "VariableDeclaration",
    kind: "let",
    declarations: [
      {
        type: "VariableDeclarator",
        id: mangleParameter(parameter, config),
        init: makeArrowExpression(parameter),
      },
    ],
  },
];
