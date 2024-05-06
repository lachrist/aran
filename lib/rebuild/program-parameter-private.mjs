import { AranTypeError } from "../error.mjs";
import { concat_X, concat__X, map } from "../util/index.mjs";
import { mangleEager, mangleParameter } from "./mangle.mjs";

/**
 * @type {(
 *   header: import("../header").PrivateHeader,
 * ) => estree.Expression}
 */
export const makePrivateOperation = (header) => {
  switch (header.parameter) {
    case "private.get": {
      return {
        type: "MemberExpression",
        optional: false,
        computed: true,
        object: {
          type: "Identifier",
          name: "obj",
        },
        property: {
          type: "PrivateIdentifier",
          name: header.payload,
        },
      };
    }
    case "private.has": {
      return {
        type: "BinaryExpression",
        operator: "in",
        left: /** @type {any} */ ({
          type: "PrivateIdentifier",
          name: header.payload,
        }),
        right: {
          type: "Identifier",
          name: "obj",
        },
      };
    }
    case "private.set": {
      return {
        type: "AssignmentExpression",
        operator: "=",
        left: {
          type: "MemberExpression",
          optional: false,
          computed: true,
          object: {
            type: "Identifier",
            name: "obj",
          },
          property: {
            type: "PrivateIdentifier",
            name: header.payload,
          },
        },
        right: {
          type: "Identifier",
          name: "val",
        },
      };
    }
    default: {
      throw new AranTypeError(header.parameter);
    }
  }
};

/**
 * @type {(
 *   header: import("../header").PrivateHeader,
 * ) => estree.Expression}
 */
const makePrivateArrow = (header) => ({
  type: "ArrowFunctionExpression",
  async: false,
  expression: true,
  params: concat_X(
    {
      type: "Identifier",
      name: "obj",
    },
    header.parameter === "private.set"
      ? [{ type: "Identifier", name: "val" }]
      : [],
  ),
  body: makePrivateOperation(header),
});

/**
 * @type {(
 *   header: import("../header").PrivateHeader,
 * ) => estree.Property}
 */
const makePrivateProperty = (header) => ({
  type: "Property",
  kind: "init",
  method: false,
  shorthand: false,
  computed: true,
  key: {
    type: "Literal",
    value: header.payload,
  },
  value: makePrivateArrow(header),
});

/**
 * @type {<P extends (
 *   | "private.get"
 *   | "private.has"
 *   | "private.set"
 * )>(
 *   parameter: P,
 *   headers: (import("../header").PrivateHeader & { parameter: P })[],
 *   config: import("./config").Config,
 * ) => estree.Statement}
 */
export const initializePrivateParameter = (parameter, headers, config) => ({
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
              name: "__proto__",
            },
            value: {
              type: "Literal",
              value: null,
            },
          },
          ...map(headers, makePrivateProperty),
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
            name: "obj",
          },
          {
            type: "Identifier",
            name: "key",
          },
          parameter === "private.set"
            ? [
                {
                  type: "Identifier",
                  name: "val",
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
            object: mangleEager(parameter, config),
            property: {
              type: "Identifier",
              name: "key",
            },
          },
          arguments:
            parameter === "private.set"
              ? [{ type: "Identifier", name: "val" }]
              : [],
        },
      },
    },
  ],
});

/**
 * @type {(
 *   header: import("../header").PrivateHeader,
 *   config: import("./config").Config,
 * ) => estree.Statement}
 */
export const updatePrivateParameter = (header, config) => ({
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
      right: mangleEager(header.parameter, config),
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
        computed: false,
        object: mangleEager(header.parameter, config),
        property: {
          type: "Identifier",
          name: header.payload,
        },
      },
      right: makePrivateArrow(header),
    },
  },
  alternate: null,
});

/**
 * @type {["private.get", "private.has", "private.set"]}
 */
export const PRIVATE_PARAMETER_ENUM = [
  "private.get",
  "private.has",
  "private.set",
];
