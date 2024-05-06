import { AranTypeError } from "../error.mjs";
import { isSloppyLookupHeader, isStrictLookupHeader } from "../header.mjs";
import { concat__X, filter, map } from "../util/index.mjs";
import { mangleEager, mangleParameter } from "./mangle.mjs";

/**
 * @type {(
 *   variable: estree.Variable,
 * ) => string}
 */
const escapeValueArgument = (variable) => (variable === "val" ? "$val" : "val");

/**
 * @type {(
 *   header: import("../header").LookupHeader,
 * ) => estree.Expression}
 */
export const makeLookupOperation = (header) => {
  switch (header.parameter) {
    case "scope.read": {
      return {
        type: "Identifier",
        name: header.payload,
      };
    }
    case "scope.typeof": {
      return {
        type: "UnaryExpression",
        operator: "typeof",
        prefix: true,
        argument: {
          type: "Identifier",
          name: header.payload,
        },
      };
    }
    case "scope.discard": {
      return {
        type: "UnaryExpression",
        operator: "delete",
        prefix: true,
        argument: {
          type: "Identifier",
          name: header.payload,
        },
      };
    }
    case "scope.write": {
      return {
        type: "AssignmentExpression",
        operator: "=",
        left: {
          type: "Identifier",
          name: header.payload,
        },
        right: {
          type: "Identifier",
          name: escapeValueArgument(header.payload),
        },
      };
    }
    default: {
      throw new AranTypeError(header);
    }
  }
};

/**
 * @type {(
 *   header: import("../header").LookupHeader,
 * ) => estree.Expression}
 */
const makeLookupArrow = (header) => {
  switch (header.mode) {
    case "strict": {
      return {
        type: "ArrowFunctionExpression",
        async: false,
        expression: false,
        params:
          header.parameter === "scope.write"
            ? [
                {
                  type: "Identifier",
                  name: escapeValueArgument(header.payload),
                },
              ]
            : [],
        body: {
          type: "BlockStatement",
          body: [
            /** @type {estree.Directive} */ ({
              type: "ExpressionStatement",
              directive: "use strict",
              expression: {
                type: "Literal",
                value: "use strict",
              },
            }),
            {
              type: "ReturnStatement",
              argument: makeLookupOperation(header),
            },
          ],
        },
      };
    }
    case "sloppy": {
      return {
        type: "ArrowFunctionExpression",
        async: false,
        expression: true,
        params:
          header.parameter === "scope.write"
            ? [
                {
                  type: "Identifier",
                  name: escapeValueArgument(header.payload),
                },
              ]
            : [],
        body: makeLookupOperation(header),
      };
    }
    default: {
      throw new AranTypeError(header);
    }
  }
};

/**
 * @type {(
 *   header: import("../header").LookupHeader,
 * ) => estree.Property}
 */
const makeLookupProperty = (header) => ({
  type: "Property",
  kind: "init",
  method: false,
  shorthand: false,
  computed: true,
  key: {
    type: "Literal",
    value: header.payload,
  },
  value: makeLookupArrow(header),
});

/**
 * @type {<P extends (
 *   | "scope.read"
 *   | "scope.write"
 *   | "scope.discard"
 *   | "scope.typeof"
 * )>(
 *   parameter: P,
 *   headers: (import("../header").EagerHeader & { parameter: P })[],
 *   config: import("./config").Config,
 * ) => estree.Statement}
 */
export const initializeLookupParameter = (parameter, headers, config) => ({
  type: "VariableDeclaration",
  kind: "let",
  declarations: [
    {
      type: "VariableDeclarator",
      id: mangleEager(parameter, config),
      init: {
        type: "ObjectExpression",
        properties: [
          {
            type: "Property",
            kind: "init",
            method: false,
            shorthand: false,
            computed: false,
            key: {
              type: "Identifier",
              name: "strict",
            },
            value: {
              type: "ObjectExpression",
              properties: [
                {
                  type: "Property",
                  kind: "init",
                  method: false,
                  shorthand: false,
                  computed: false,
                  key: {
                    type: "Identifier",
                    name: "__proto__",
                  },
                  value: {
                    type: "Literal",
                    value: null,
                  },
                },
                ...map(
                  filter(headers, isStrictLookupHeader),
                  makeLookupProperty,
                ),
              ],
            },
          },
          {
            type: "Property",
            kind: "init",
            method: false,
            shorthand: false,
            computed: false,
            key: {
              type: "Identifier",
              name: "sloppy",
            },
            value: {
              type: "ObjectExpression",
              properties: [
                {
                  type: "Property",
                  kind: "init",
                  method: false,
                  shorthand: false,
                  computed: false,
                  key: {
                    type: "Identifier",
                    name: "__proto__",
                  },
                  value: {
                    type: "Literal",
                    value: null,
                  },
                },
                ...map(
                  filter(headers, isSloppyLookupHeader),
                  makeLookupProperty,
                ),
              ],
            },
          },
        ],
      },
    },
    {
      type: "VariableDeclarator",
      id: mangleParameter(parameter, config),
      init: {
        type: "ArrowFunctionExpression",
        async: false,
        expression: true,
        params: concat__X(
          {
            type: "Identifier",
            name: "mode",
          },
          {
            type: "Identifier",
            name: "variable",
          },
          parameter === "scope.write"
            ? [
                {
                  type: "Identifier",
                  name: "value",
                },
              ]
            : [],
        ),
        body: {
          type: "CallExpression",
          optional: false,
          callee: {
            type: "MemberExpression",
            optional: false,
            computed: false,
            object: {
              type: "MemberExpression",
              optional: false,
              computed: true,
              object: mangleEager(parameter, config),
              property: {
                type: "Identifier",
                name: "mode",
              },
            },
            property: {
              type: "Identifier",
              name: "variable",
            },
          },
          arguments:
            parameter === "scope.write"
              ? [
                  {
                    type: "Identifier",
                    name: "value",
                  },
                ]
              : [],
        },
      },
    },
  ],
});

/**
 * @type {(
 *   header: import("../header").LookupHeader,
 *   config: import("./config").Config,
 * ) => estree.Statement}
 */
export const updateLookupParameter = (header, config) => ({
  type: "IfStatement",
  test: {
    type: "UnaryExpression",
    operator: "!",
    prefix: true,
    argument: {
      type: "BinaryExpression",
      operator: "in",
      left: {
        type: "Literal",
        value: header.payload,
      },
      right: {
        type: "MemberExpression",
        optional: false,
        computed: true,
        object: mangleEager(header.parameter, config),
        property: {
          type: "Literal",
          value: header.mode,
        },
      },
    },
  },
  consequent: {
    type: "ExpressionStatement",
    expression: {
      type: "AssignmentExpression",
      operator: "=",
      left: {
        type: "MemberExpression",
        optional: false,
        computed: true,
        object: {
          type: "MemberExpression",
          optional: false,
          computed: true,
          object: mangleEager(header.parameter, config),
          property: {
            type: "Literal",
            value: header.mode,
          },
        },
        property: {
          type: "Literal",
          value: header.payload,
        },
      },
      right: makeLookupArrow(header),
    },
  },
  alternate: null,
});

/**
 * @type {["scope.read", "scope.write", "scope.typeof", "scope.discard"]}
 */
export const LOOKUP_PARAMETER_ENUM = [
  "scope.read",
  "scope.write",
  "scope.typeof",
  "scope.discard",
];
