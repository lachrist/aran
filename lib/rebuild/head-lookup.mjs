import { AranTypeError } from "../error.mjs";
import {
  compileGet,
  every,
  filter,
  filterNarrow,
  flatMap,
  map,
  removeDuplicate,
} from "../util/index.mjs";
import { mangleArgument } from "./mangle.mjs";

/** @type {["strict", "sloppy"]} */
const MODE = ["strict", "sloppy"];

/** @type {["read", "write", "typeof", "discard"]} */
const OPERATION = ["read", "write", "typeof", "discard"];

const getVariable = compileGet("variable");

/**
 * @type {(
 *   variable: estree.Variable | null,
 * ) => variable is estree.Variable}
 */
const isStaticVariable = (variable) => variable !== null;

/* eslint-disable local/no-impure */
/**
 * @type {(
 *   nodes: [estree.Expression, ...estree.Expression[]],
 * ) => estree.Expression}
 */
const concat = (nodes) => {
  let node = nodes[0];
  for (let index = 1; index < nodes.length; index += 1) {
    node = {
      type: "BinaryExpression",
      operator: "+",
      left: node,
      right: nodes[index],
    };
  }
  return node;
};
/* eslint-enable local/no-impure */

/**
 * @type {(
 *   operation: "read" | "write" | "typeof" | "discard",
 *   variable: estree.Variable,
 *   value: string,
 * ) => estree.Expression}
 */
const makeLookupNode = (operation, variable, value) => {
  switch (operation) {
    case "read": {
      return {
        type: "Identifier",
        name: variable,
      };
    }
    case "write": {
      return {
        type: "AssignmentExpression",
        operator: "=",
        left: {
          type: "Identifier",
          name: variable,
        },
        right: {
          type: "Identifier",
          name: value,
        },
      };
    }
    case "typeof": {
      return {
        type: "UnaryExpression",
        operator: "typeof",
        prefix: true,
        argument: {
          type: "Identifier",
          name: variable,
        },
      };
    }
    case "discard": {
      return {
        type: "UnaryExpression",
        operator: "delete",
        prefix: true,
        argument: {
          type: "Identifier",
          name: variable,
        },
      };
    }
    default: {
      throw new AranTypeError(operation);
    }
  }
};

/**
 * @type {(
 *   operation: "read" | "write" | "typeof" | "discard",
 *   var_arg: string,
 *   val_arg: string,
 * ) => estree.Expression}
 */
const makeLookupCode = (operation, var_arg, val_arg) => {
  switch (operation) {
    case "read": {
      return concat([
        {
          type: "Literal",
          value: "(() => (",
        },
        {
          type: "Identifier",
          name: var_arg,
        },
        {
          type: "Literal",
          value: "));",
        },
      ]);
    }
    case "typeof": {
      return concat([
        {
          type: "Literal",
          value: "(() => (typeof ",
        },
        {
          type: "Identifier",
          name: var_arg,
        },
        {
          type: "Literal",
          value: "));",
        },
      ]);
    }
    case "discard": {
      return concat([
        {
          type: "Literal",
          value: "(() => (delete ",
        },
        {
          type: "Identifier",
          name: var_arg,
        },
        {
          type: "Literal",
          value: "));",
        },
      ]);
    }
    case "write": {
      return concat([
        {
          type: "Literal",
          value: `((${val_arg}) => (`,
        },
        {
          type: "Identifier",
          name: var_arg,
        },
        {
          type: "Literal",
          value: ` = ${val_arg}));`,
        },
      ]);
    }
    default: {
      throw new AranTypeError(operation);
    }
  }
};

/**
 * @type {(
 *   mode: "strict" | "sloppy",
 *   operation: "read" | "write" | "typeof" | "discard",
 *   variables: estree.Variable[],
 *   config: import("./config").Config,
 * ) => estree.Expression}
 */
const makeStaticLookupArrow = (mode, operation, variables, config) => {
  const var_arg = mangleArgument("var", config.escape);
  const val_arg = mangleArgument("val", config.escape);
  return {
    type: "ArrowFunctionExpression",
    async: false,
    expression: false,
    params:
      operation === "write"
        ? [
            {
              type: "Identifier",
              name: var_arg,
            },
            {
              type: "Identifier",
              name: val_arg,
            },
          ]
        : [
            {
              type: "Identifier",
              name: var_arg,
            },
          ],
    body: {
      type: "BlockStatement",
      body: [
        ...(mode === "strict"
          ? [
              /** @type {estree.Directive} */ ({
                type: "ExpressionStatement",
                expression: {
                  type: "Literal",
                  value: "use strict",
                },
                directive: "use strict",
              }),
            ]
          : []),
        .../** @type {estree.Statement[]} */ (
          variables.length === 0
            ? []
            : [
                {
                  type: "SwitchStatement",
                  discriminant: {
                    type: "Identifier",
                    name: var_arg,
                  },
                  cases: map(variables, (variable) => ({
                    type: "SwitchCase",
                    test: {
                      type: "Literal",
                      value: variable,
                    },
                    consequent:
                      mode === "strict" &&
                      operation === "write" &&
                      (variable === "arguments" || variable === "eval")
                        ? [
                            {
                              type: "ThrowStatement",
                              argument: {
                                type: "CallExpression",
                                optional: false,
                                // This should never happen.
                                // So accessing unsafe ReferenceError global is fine.
                                callee: {
                                  type: "Identifier",
                                  name: "ReferenceError",
                                },
                                arguments: [
                                  {
                                    type: "Literal",
                                    value:
                                      "Illegal write to strict readonly variable: ",
                                  },
                                ],
                              },
                            },
                          ]
                        : [
                            {
                              type: "ReturnStatement",
                              argument: makeLookupNode(
                                operation,
                                variable,
                                val_arg,
                              ),
                            },
                          ],
                  })),
                },
              ]
        ),
        {
          type: "ThrowStatement",
          argument: {
            type: "CallExpression",
            optional: false,
            // This should never happen.
            // So accessing unsafe ReferenceError global is fine.
            callee: {
              type: "Identifier",
              name: "ReferenceError",
            },
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
                  name: var_arg,
                },
              },
            ],
          },
        },
      ],
    },
  };
};

/**
 * @type {(
 *   mode: "strict" | "sloppy",
 *   operation: "read" | "write" | "typeof" | "discard",
 *   variables: estree.Variable[],
 *   config: import("./config").Config,
 * ) => estree.Expression}
 */
const makeDynamicLookupArrow = (mode, operation, variables, config) => {
  const var_arg = mangleArgument("var", config.escape);
  const val_arg = mangleArgument("val", config.escape);
  const rec_arg = mangleArgument("rec", config.escape);
  return {
    type: "CallExpression",
    optional: false,
    callee: {
      type: "ArrowFunctionExpression",
      async: false,
      expression: true,
      params: [
        {
          type: "Identifier",
          name: rec_arg,
        },
      ],
      body: {
        type: "ArrowFunctionExpression",
        async: false,
        expression: false,
        params:
          operation === "write"
            ? [
                {
                  type: "Identifier",
                  name: var_arg,
                },
                {
                  type: "Identifier",
                  name: val_arg,
                },
              ]
            : [
                {
                  type: "Identifier",
                  name: var_arg,
                },
              ],
        body: {
          type: "BlockStatement",
          body: [
            ...(mode === "strict"
              ? [
                  /** @type {estree.Directive} */
                  ({
                    type: "ExpressionStatement",
                    expression: {
                      type: "Literal",
                      value: "use strict",
                    },
                    directive: "use strict",
                  }),
                ]
              : []),
            {
              type: "ReturnStatement",
              argument: {
                type: "ConditionalExpression",
                test: {
                  type: "MemberExpression",
                  computed: true,
                  optional: false,
                  object: {
                    type: "Identifier",
                    name: rec_arg,
                  },
                  property: {
                    type: "Identifier",
                    name: var_arg,
                  },
                },
                consequent: {
                  type: "CallExpression",
                  optional: false,
                  callee: {
                    type: "MemberExpression",
                    computed: true,
                    optional: false,
                    object: {
                      type: "Identifier",
                      name: rec_arg,
                    },
                    property: {
                      type: "Identifier",
                      name: var_arg,
                    },
                  },
                  arguments:
                    operation === "write"
                      ? [
                          {
                            type: "Identifier",
                            name: val_arg,
                          },
                        ]
                      : [],
                },
                alternate: {
                  type: "SequenceExpression",
                  expressions: [
                    {
                      type: "AssignmentExpression",
                      operator: "=",
                      left: {
                        type: "MemberExpression",
                        computed: true,
                        optional: false,
                        object: {
                          type: "Identifier",
                          name: rec_arg,
                        },
                        property: {
                          type: "Identifier",
                          name: var_arg,
                        },
                      },
                      right: {
                        type: "CallExpression",
                        optional: false,
                        callee: {
                          type: "Identifier",
                          name: "eval",
                        },
                        arguments: [
                          makeLookupCode(operation, var_arg, val_arg),
                        ],
                      },
                    },
                    {
                      type: "CallExpression",
                      optional: false,
                      callee: {
                        type: "MemberExpression",
                        computed: true,
                        optional: false,
                        object: {
                          type: "Identifier",
                          name: rec_arg,
                        },
                        property: {
                          type: "Identifier",
                          name: var_arg,
                        },
                      },
                      arguments:
                        operation === "write"
                          ? [
                              {
                                type: "Identifier",
                                name: val_arg,
                              },
                            ]
                          : [],
                    },
                  ],
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
            variables,
            (variable) =>
              /** @type {estree.Property} */ ({
                type: "Property",
                kind: "init",
                method: false,
                shorthand: false,
                computed: false,
                key: {
                  type: "Identifier",
                  name: variable,
                },
                value:
                  mode === "strict" &&
                  operation === "write" &&
                  (variable === "eval" || variable === "arguments")
                    ? {
                        type: "ArrowFunctionExpression",
                        async: false,
                        expression: false,
                        params: [
                          {
                            type: "Identifier",
                            name: val_arg,
                          },
                        ],
                        body: [
                          {
                            type: "BlockStatement",
                            body: [
                              {
                                type: "ThrowStatement",
                                argument: {
                                  type: "CallExpression",
                                  optional: false,
                                  // This should never happen.
                                  // So accessing unsafe ReferenceError global is fine.
                                  callee: {
                                    type: "Identifier",
                                    name: "ReferenceError",
                                  },
                                  arguments: [
                                    {
                                      type: "Literal",
                                      value:
                                        "Illegal write to strict readonly variable: ",
                                    },
                                  ],
                                },
                              },
                            ],
                          },
                        ],
                      }
                    : {
                        type: "ArrowFunctionExpression",
                        async: false,
                        expression: true,
                        params:
                          operation === "write"
                            ? [
                                {
                                  type: "Identifier",
                                  name: val_arg,
                                },
                              ]
                            : [],
                        body: makeLookupNode(operation, variable, val_arg),
                      },
              }),
          ),
        ],
      },
    ],
  };
};

/**
 * @type {(
 *   type: "strict" | "sloppy",
 *   operation: "read" | "write" | "typeof" | "discard",
 *   head: import("../header").LookupHeader[],
 *   config: import("./config").Config,
 * ) => [
 *   aran.Parameter,
 *   estree.Expression,
 * ][]}
 */
export const makeLookupDeclarator = (mode, operation, head, config) => {
  /** @type {import("../header").LookupParameter | "discard.strict"} */
  const parameter = `${operation}.${mode}`;
  if (parameter === "discard.strict") {
    return [];
  } else {
    const variables = removeDuplicate(
      map(
        filter(head, (header) => header.type === parameter),
        getVariable,
      ),
    );
    if (variables.length === 0) {
      return [];
    } else {
      return [
        [
          parameter,
          every(variables, isStaticVariable)
            ? makeStaticLookupArrow(mode, operation, variables, config)
            : makeDynamicLookupArrow(
                mode,
                operation,
                filterNarrow(variables, isStaticVariable),
                config,
              ),
        ],
      ];
    }
  }
};

/**
 * @type {(
 *   head: import("../header").LookupHeader[],
 *   config: import("./config").Config,
 * ) => [
 *   aran.Parameter,
 *   estree.Expression,
 * ][]}
 */
export const listLookupDeclarator = (head, config) =>
  flatMap(MODE, (mode) =>
    flatMap(OPERATION, (operation) =>
      makeLookupDeclarator(mode, operation, head, config),
    ),
  );
