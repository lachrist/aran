import { AranTypeError } from "../error.mjs";
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
        type: "ArrowFunctionExpression",
        id: null,
        async: false,
        generator: false,
        expression: true,
        params: [
          {
            type: "Identifier",
            name: /** @type {import("estree-sentry").VariableName} */ (
              "source"
            ),
          },
        ],
        body: {
          type: "ImportExpression",
          source: {
            type: "Identifier",
            name: /** @type {import("estree-sentry").VariableName} */ (
              "source"
            ),
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
 *   parameter: import("./parameter-regular").RegularParameter,
 *   config: import("./config").InternalConfig,
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
