import { AranTypeError } from "../error.mjs";
import { getParameterFunctionName } from "../lang/index.mjs";
import { mangleParameter } from "./mangle.mjs";

/**
 * @type {(
 *   parameter: import("./parameter-regular").RegularParameter,
 * ) => import("estree-sentry").Expression<{}>}
 */
const makeRegularParameterExpression = (parameter) => {
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
          name: /** @type {import("estree-sentry").PublicKeyName} */ ("meta"),
        },
      };
    }
    case "import": {
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
                  /** @type {string} */ (getParameterFunctionName("import"))
                ),
              },
              value: {
                type: "FunctionExpression",
                id: null,
                async: false,
                generator: false,
                params: [
                  {
                    type: "Identifier",
                    name: /** @type {import("estree-sentry").VariableName} */ (
                      "source"
                    ),
                  },
                ],
                body: {
                  type: "BlockStatement",
                  body: [
                    {
                      type: "ReturnStatement",
                      argument: {
                        type: "ImportExpression",
                        source: {
                          type: "Identifier",
                          name: /** @type {import("estree-sentry").VariableName} */ (
                            "source"
                          ),
                        },
                      },
                    },
                  ],
                },
              },
            },
          ],
        },
        property: {
          type: "Identifier",
          name: /** @type {import("estree-sentry").PublicKeyName} */ (
            /** @type {string} */ (getParameterFunctionName("import"))
          ),
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
 *   parameter: import("./parameter-regular").RegularParameter,
 *   config: import("./config-internal").InternalConfig,
 * ) => import("estree-sentry").Statement<{}>}
 */
export const makeRegularParameterDeclaration = (parameter, config) => ({
  type: "VariableDeclaration",
  kind: "let",
  declarations: [
    {
      type: "VariableDeclarator",
      id: mangleParameter(parameter, config),
      init: makeRegularParameterExpression(parameter),
    },
  ],
});
