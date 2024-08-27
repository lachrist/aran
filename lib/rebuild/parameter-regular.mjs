import { AranTypeError } from "../error.mjs";
import { mangleParameter } from "./mangle.mjs";

/**
 * @type {(
 *   parameter: import("./parameter-regular").RegularParameter,
 * ) => import("../estree").Expression}
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
          name: /** @type {import("../estree").Meta} */ ("import"),
        },
        property: {
          type: "Identifier",
          name: /** @type {import("../estree").Meta} */ ("meta"),
        },
      };
    }
    case "import": {
      return {
        type: "ArrowFunctionExpression",
        async: false,
        generator: false,
        expression: true,
        params: [
          {
            type: "Identifier",
            name: /** @type {import("../estree").Variable} */ ("source"),
          },
        ],
        body: {
          type: "ImportExpression",
          source: {
            type: "Identifier",
            name: /** @type {import("../estree").Variable} */ ("source"),
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
 *   config: import("./config").Config,
 * ) => import("../estree").Statement[]}
 */
export const listRegularParameterDeclaration = (parameter, config) => [
  {
    type: "VariableDeclaration",
    kind: "let",
    declarations: [
      {
        type: "VariableDeclarator",
        id: mangleParameter(parameter, config),
        init: makeRegularParameterExpression(parameter),
      },
    ],
  },
];
