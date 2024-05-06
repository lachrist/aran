import { AranTypeError } from "../error.mjs";
import {
  concatXX_,
  concatX_,
  concat_X,
  concat__X,
  filter,
  map,
} from "../util/index.mjs";
import { makeIntrinsicExpression } from "./intrinsic.mjs";
import { mangleParameter } from "./mangle.mjs";

/**
 * @type {["strict", "sloppy"]}
 */
const MODE = ["strict", "sloppy"];

/**
 * @type {(
 *   variable: estree.Variable
 * ) => string}
 */
const escapeValueVariable = (variable) =>
  variable === "value" ? "$value" : variable;

/**
 * @type {(
 *   name: string
 * ) => estree.Identifier}
 */
const makeIdentifier = (name) => ({
  type: "Identifier",
  name,
});

/////////////
// private //
/////////////

/**
 * @type {(
 *   header: import("../header").PrivateParameterHeader,
 * ) => estree.Expression}
 */
const makePrivateResult = (header) => {
  switch (header.parameter) {
    case "private.get": {
      return {
        type: "MemberExpression",
        optional: false,
        computed: false,
        object: {
          type: "Identifier",
          name: "object",
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
          name: "object",
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
          computed: false,
          object: {
            type: "Identifier",
            name: "object",
          },
          property: {
            type: "PrivateIdentifier",
            name: header.payload,
          },
        },
        right: {
          type: "Identifier",
          name: "value",
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
 *   header: import("../header").PrivateParameterHeader,
 * ) => estree.SwitchCase}
 */
const makePrivateCase = (header) => ({
  type: "SwitchCase",
  test: {
    type: "Literal",
    value: header.payload,
  },
  consequent: [
    {
      type: "ReturnStatement",
      argument: makePrivateResult(header),
    },
  ],
});

/**
 * @type {<P extends "private.get" | "private.has" | "private.set">(
 *   parameter: P,
 *   header: (import("../header").PrivateParameterHeader & {
 *     parameter: P,
 *   })[],
 *   config: import("./config").Config,
 * ) => estree.Expression}
 */
const makePrivateArrow = (parameter, headers, config) => ({
  type: "ArrowFunctionExpression",
  async: false,
  expression: false,
  params: concat__X(
    {
      type: "Identifier",
      name: "object",
    },
    {
      type: "Identifier",
      name: "key",
    },
    parameter === "private.set"
      ? [
          {
            type: "Identifier",
            name: "value",
          },
        ]
      : [],
  ),
  body: {
    type: "BlockStatement",
    body: concatX_(
      headers.length === 0
        ? []
        : [
            {
              type: "SwitchStatement",
              discriminant: {
                type: "Identifier",
                name: "key",
              },
              cases: map(headers, makePrivateCase),
            },
          ],
      {
        type: "ThrowStatement",
        argument: {
          type: "NewExpression",
          callee: makeIntrinsicExpression("SyntaxError", config),
          arguments: [
            {
              type: "BinaryExpression",
              operator: "+",
              left: {
                type: "Literal",
                value: "missing private key: ",
              },
              right: {
                type: "Identifier",
                name: "key",
              },
            },
          ],
        },
      },
    ),
  },
});

///////////
// scope //
///////////

/**
 * @type {(
 *   header: import("../header").ScopeParameterHeader,
 * ) => estree.Expression}
 */
const makeScopeResult = (header) => {
  switch (header.parameter) {
    case "scope.read": {
      return {
        type: "Identifier",
        name: header.payload,
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
          name: escapeValueVariable(header.payload),
        },
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
    default: {
      throw new AranTypeError(header);
    }
  }
};

/**
 * @type {(
 *   header: import("../header").ScopeParameterHeader,
 * ) => estree.SwitchCase}
 */
const makeScopeCase = (header) => ({
  type: "SwitchCase",
  test: {
    type: "Literal",
    value: header.payload,
  },
  consequent: [
    {
      type: "ReturnStatement",
      argument: makeScopeResult(header),
    },
  ],
});

/**
 * @type {(
 *   mode: "strict" | "sloppy",
 * ) => estree.Statement[]}
 */
const listDirective = (mode) => {
  switch (mode) {
    case "strict": {
      return [
        {
          type: "ExpressionStatement",
          expression: {
            type: "Literal",
            value: "use strict",
          },
        },
      ];
    }
    case "sloppy": {
      return [];
    }
    default: {
      throw new AranTypeError(mode);
    }
  }
};

/**
 * @type {<
 *   M extends "strict" | "sloppy",
 *   P extends "scope.read" | "scope.write" | "scope.typeof" | "scope.discard",
 * >(
 *   mode: M,
 *   parameter: P,
 *   headers: (import("../header").ParameterHeader & {
 *     mode: M;
 *     parameter: P,
 *   })[],
 *   config: import("./config").Config,
 * ) => estree.Expression}
 */
const makeScopeArrow = (mode, parameter, headers, config) => ({
  type: "ArrowFunctionExpression",
  async: false,
  expression: false,
  params: concat__X(
    {
      type: "Identifier",
      name: "strict",
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
    type: "BlockStatement",
    body: concatXX_(
      listDirective(mode),
      headers.length === 0
        ? []
        : [
            {
              type: "SwitchStatement",
              discriminant: {
                type: "Identifier",
                name: "variable",
              },
              cases: map(headers, makeScopeCase),
            },
          ],
      {
        type: "ThrowStatement",
        argument: {
          type: "NewExpression",
          callee: makeIntrinsicExpression("ReferenceError", config),
          arguments: [
            {
              type: "BinaryExpression",
              operator: "+",
              left: {
                type: "Literal",
                value: "missing variable: ",
              },
              right: {
                type: "Identifier",
                name: "variable",
              },
            },
          ],
        },
      },
    ),
  },
});

////////////
// export //
////////////

/**
 * @type {<P extends import("../header").ParameterHeader["parameter"]>(
 *   parameter: P,
 *   headers: (import("../header").ParameterHeader & { parameter: P })[],
 *   config: import("./config").Config,
 * ) => estree.Expression}
 */
export const makeParameterValue = (parameter, headers, config) => {
  if (parameter === "this") {
    return {
      type: "ThisExpression",
    };
  } else if (parameter === "new.target") {
    return {
      type: "MetaProperty",
      meta: {
        type: "Identifier",
        name: "new",
      },
      property: {
        type: "Identifier",
        name: "target",
      },
    };
  } else if (parameter === "import.meta") {
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
  } else if (parameter === "import.dynamic") {
    return {
      type: "ArrowFunctionExpression",
      async: false,
      expression: true,
      params: [
        {
          type: "Identifier",
          name: "source",
        },
      ],
      body: {
        type: "ImportExpression",
        source: {
          type: "Identifier",
          name: "source",
        },
      },
    };
  } else if (parameter === "super.get") {
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
  } else if (parameter === "super.set") {
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
          name: "value",
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
          name: "value",
        },
      },
    };
  } else if (parameter === "super.call") {
    return {
      type: "ArrowFunctionExpression",
      async: false,
      expression: true,
      params: [
        {
          type: "RestElement",
          argument: {
            type: "Identifier",
            name: "args",
          },
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
  } else if (
    parameter === "private.get" ||
    parameter === "private.has" ||
    parameter === "private.set"
  ) {
    return makePrivateArrow(parameter, /** @type {any} */ (headers), config);
  } else if (
    parameter === "scope.read" ||
    parameter === "scope.write" ||
    parameter === "scope.typeof" ||
    parameter === "scope.discard"
  ) {
    return {
      type: "CallExpression",
      optional: false,
      callee: {
        type: "ArrowFunctionExpression",
        async: false,
        expression: true,
        params: map(MODE, makeIdentifier),
        body: {
          type: "ArrowFunctionExpression",
          async: false,
          expression: false,
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
              ? [{ type: "Identifier", name: "value" }]
              : [],
          ),
          body: {
            type: "BlockStatement",
            body: [
              {
                type: "SwitchStatement",
                discriminant: {
                  type: "Identifier",
                  name: "mode",
                },
                cases: map(MODE, (mode) => ({
                  type: "SwitchCase",
                  test: {
                    type: "Literal",
                    value: mode,
                  },
                  consequent: [
                    {
                      type: "ReturnStatement",
                      argument: {
                        type: "CallExpression",
                        optional: false,
                        callee: {
                          type: "Identifier",
                          name: mode,
                        },
                        arguments: concat_X(
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
                      },
                    },
                  ],
                })),
              },
              {
                type: "ThrowStatement",
                argument: {
                  type: "NewExpression",
                  callee: makeIntrinsicExpression("SyntaxError", config),
                  arguments: [
                    {
                      type: "BinaryExpression",
                      operator: "+",
                      left: {
                        type: "Literal",
                        value: "invalid mode: ",
                      },
                      right: {
                        type: "Identifier",
                        name: "mode",
                      },
                    },
                  ],
                },
              },
            ],
          },
        },
      },
      arguments: map(MODE, (mode) =>
        makeScopeArrow(
          mode,
          parameter,
          /** @type {any} */ (
            filter(headers, (header) => header.mode === mode)
          ),
          config,
        ),
      ),
    };
  } else {
    throw new AranTypeError(parameter);
  }
};

/**
 * @type {<P extends import("../header").ParameterHeader["parameter"]>(
 *   parameter: P,
 *   headers: (import("../header").ParameterHeader & {
 *     parameter: P,
 *   })[],
 *   config: import("./config").Config,
 * ) => estree.Statement}
 */
export const initializeProgramParameter = (parameter, headers, config) => ({
  type: "VariableDeclaration",
  kind: "let",
  declarations: [
    {
      type: "VariableDeclarator",
      id: mangleParameter(parameter, config),
      init: makeParameterValue(parameter, headers, config),
    },
  ],
});
