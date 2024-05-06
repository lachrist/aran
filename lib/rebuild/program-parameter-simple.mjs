import { AranTypeError } from "../error.mjs";
import { mangleParameter } from "./mangle.mjs";

/**
 * @type {(
 *   parameter: (
 *     | "this"
 *     | "import.meta"
 *     | "import.dynamic"
 *     | "super.get"
 *     | "super.set"
 *     | "super.call"
 *   ),
 * ) => estree.Expression}
 */
const makeSimpleInitializer = (parameter) => {
  switch (parameter) {
    case "this": {
      return {
        type: "ThisExpression",
      };
    }
    case "import.meta": {
      return {
        type: "MetaProperty",
        meta: {
          type: "Identifier",
          name: "import",
        },
        property: {
          type: "Identifier",
          name: "meta",
        },
      };
    }
    case "import.dynamic": {
      return {
        type: "ArrowFunctionExpression",
        async: false,
        expression: true,
        params: [
          {
            type: "Identifier",
            name: "src",
          },
        ],
        body: {
          type: "ImportExpression",
          source: {
            type: "Identifier",
            name: "src",
          },
        },
      };
    }
    case "super.get": {
      return {
        type: "ArrowFunctionExpression",
        async: false,
        expression: true,
        params: [
          {
            type: "Identifier",
            name: "key",
          },
        ],
        body: {
          type: "MemberExpression",
          computed: true,
          optional: false,
          object: {
            type: "Super",
          },
          property: {
            type: "Identifier",
            name: "key",
          },
        },
      };
    }
    case "super.set": {
      return {
        type: "ArrowFunctionExpression",
        async: false,
        expression: true,
        params: [
          {
            type: "Identifier",
            name: "key",
          },
          {
            type: "Identifier",
            name: "val",
          },
        ],
        body: {
          type: "AssignmentExpression",
          operator: "=",
          left: {
            type: "MemberExpression",
            computed: true,
            optional: false,
            object: {
              type: "Super",
            },
            property: {
              type: "Identifier",
              name: "key",
            },
          },
          right: {
            type: "Identifier",
            name: "val",
          },
        },
      };
    }
    case "super.call": {
      return {
        type: "ArrowFunctionExpression",
        async: false,
        expression: true,
        params: [
          {
            type: "Identifier",
            name: "args",
          },
        ],
        body: {
          type: "CallExpression",
          optional: false,
          callee: {
            type: "Super",
          },
          arguments: [
            {
              type: "SpreadElement",
              argument: {
                type: "Identifier",
                name: "args",
              },
            },
          ],
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
 *   parameter: (
 *     | "this"
 *     | "import.meta"
 *     | "import.dynamic"
 *     | "super.get"
 *     | "super.set"
 *     | "super.call"
 *   ),
 *   config: import("./config").Config,
 * ) => estree.Statement}
 */
export const initializeSimpleParameter = (parameter, config) => ({
  type: "VariableDeclaration",
  kind: "let",
  declarations: [
    {
      type: "VariableDeclarator",
      id: mangleParameter(parameter, config),
      init: makeSimpleInitializer(parameter),
    },
  ],
});
