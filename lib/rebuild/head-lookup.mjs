import { AranTypeError } from "../error.mjs";
import {
  getLookupParameter,
  isDynamicHeader,
  isStaticLookupHeader,
} from "../header.mjs";
import {
  compileGet,
  filter,
  filterNarrow,
  flatMap,
  map,
  removeDuplicate,
  some,
} from "../util/index.mjs";
import { makeIntrinsicExpression } from "./intrinsic.mjs";
import {
  mangleArgument,
  mangleEval,
  mangleExternal,
  mangleKey,
  mangleParameter,
} from "./mangle.mjs";

/** @type {["strict", "sloppy"]} */
const MODE = ["strict", "sloppy"];

/** @type {["read", "write", "typeof", "discard"]} */
const OPERATION = ["read", "write", "typeof", "discard"];

const getVariable = compileGet("variable");

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
 *   value: estree.Identifier,
 *   config: import("./config").Config,
 * ) => estree.Expression}
 */
const makeLookupNode = (operation, variable, value, config) => {
  switch (operation) {
    case "read": {
      return mangleExternal(variable, config);
    }
    case "write": {
      return {
        type: "AssignmentExpression",
        operator: "=",
        left: mangleExternal(variable, config),
        right: value,
      };
    }
    case "typeof": {
      return {
        type: "UnaryExpression",
        operator: "typeof",
        prefix: true,
        argument: mangleExternal(variable, config),
      };
    }
    case "discard": {
      return {
        type: "UnaryExpression",
        operator: "delete",
        prefix: true,
        argument: mangleExternal(variable, config),
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
 *   var_arg: estree.Identifier,
 *   val_arg: estree.Identifier,
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
        var_arg,
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
        var_arg,
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
        var_arg,
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
          value: `((${val_arg.name}) => (`,
        },
        var_arg,
        {
          type: "Literal",
          value: ` = ${val_arg.name}));`,
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
  const var_arg = mangleArgument("var", config);
  const val_arg = mangleArgument("val", config);
  return {
    type: "ArrowFunctionExpression",
    async: false,
    expression: false,
    params: operation === "write" ? [var_arg, val_arg] : [var_arg],
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
                  discriminant: var_arg,
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
                                callee: makeIntrinsicExpression(
                                  "ReferenceError",
                                  config,
                                ),
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
                                config,
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
            callee: makeIntrinsicExpression("ReferenceError", config),
            arguments: [
              {
                type: "BinaryExpression",
                operator: "+",
                left: {
                  type: "Literal",
                  value: "missing variable: ",
                },
                right: var_arg,
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
  const var_arg = mangleArgument("var", config);
  const val_arg = mangleArgument("val", config);
  const rec_arg = mangleArgument("rec", config);
  return {
    type: "CallExpression",
    optional: false,
    callee: {
      type: "ArrowFunctionExpression",
      async: false,
      expression: true,
      params: [rec_arg],
      body: {
        type: "ArrowFunctionExpression",
        async: false,
        expression: false,
        params: operation === "write" ? [var_arg, val_arg] : [var_arg],
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
                  object: rec_arg,
                  property: var_arg,
                },
                consequent: {
                  type: "CallExpression",
                  optional: false,
                  callee: {
                    type: "MemberExpression",
                    computed: true,
                    optional: false,
                    object: rec_arg,
                    property: var_arg,
                  },
                  arguments: operation === "write" ? [val_arg] : [],
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
                        object: rec_arg,
                        property: var_arg,
                      },
                      right: {
                        type: "CallExpression",
                        optional: false,
                        callee: mangleEval(mode, config),
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
                        object: rec_arg,
                        property: var_arg,
                      },
                      arguments: operation === "write" ? [val_arg] : [],
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
            key: mangleKey(/** @type {estree.Key} */ ("__proto__")),
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
                key: mangleKey(
                  /** @type {estree.Key} */ (/** @type {string} */ (variable)),
                ),
                value:
                  mode === "strict" &&
                  operation === "write" &&
                  (variable === "eval" || variable === "arguments")
                    ? {
                        type: "ArrowFunctionExpression",
                        async: false,
                        expression: false,
                        params: [val_arg],
                        body: [
                          {
                            type: "BlockStatement",
                            body: [
                              {
                                type: "ThrowStatement",
                                argument: {
                                  type: "CallExpression",
                                  optional: false,
                                  callee: makeIntrinsicExpression(
                                    "ReferenceError",
                                    config,
                                  ),
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
                        params: operation === "write" ? [val_arg] : [],
                        body: makeLookupNode(
                          operation,
                          variable,
                          val_arg,
                          config,
                        ),
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
 *   mode: "strict" | "sloppy",
 *   operation: "read" | "write" | "typeof" | "discard",
 *   head: import("../header").LookupHeader[],
 *   config: import("./config").Config,
 * ) => [
 *   estree.Identifier,
 *   estree.Expression,
 * ][]}
 */
export const makeLookupDeclarator = (mode, operation, head, config) => {
  if (head.length === 0) {
    return [];
  } else {
    const variables = removeDuplicate(
      map(filterNarrow(head, isStaticLookupHeader), getVariable),
    );
    return [
      [
        // `head[0]` is same as `${operation}.${mode}` but avoid 'discard.strict'.
        mangleParameter(getLookupParameter(head[0]), config),
        some(head, isDynamicHeader)
          ? makeDynamicLookupArrow(mode, operation, variables, config)
          : makeStaticLookupArrow(mode, operation, variables, config),
      ],
    ];
  }
};

/**
 * @type {(
 *   head: import("../header").LookupHeader[],
 *   config: import("./config").Config,
 * ) => [
 *   estree.Identifier,
 *   estree.Expression,
 * ][]}
 */
export const listLookupDeclarator = (head, config) =>
  flatMap(MODE, (mode) =>
    flatMap(OPERATION, (operation) =>
      makeLookupDeclarator(
        mode,
        operation,
        filter(
          head,
          (header) => header.type === operation && header.mode === mode,
        ),
        config,
      ),
    ),
  );
