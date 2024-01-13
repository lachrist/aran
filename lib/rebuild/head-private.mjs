import { AranTypeError } from "../error.mjs";
import {
  compileGet,
  filter,
  flatMap,
  map,
  removeDuplicate,
} from "../util/index.mjs";
import { mangleEval, mangleParameter } from "./mangle.mjs";

/** @type {["has", "get", "set"]} */
const OPERATION = ["has", "get", "set"];

const getKey = compileGet("key");

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
 *   operation: "has" | "get" | "set",
 *   obj_arg: string,
 *   key: estree.PrivateKey,
 *   val_arg: string,
 * ) => estree.Expression}
 */
const makePrivateNode = (operation, obj_arg, key, val_arg) => {
  switch (operation) {
    case "has": {
      return {
        type: "BinaryExpression",
        operator: "in",
        left: /** @type {any} */ ({
          type: "PrivateIdentifier",
          name: key,
        }),
        right: {
          type: "Identifier",
          name: obj_arg,
        },
      };
    }
    case "get": {
      return {
        type: "MemberExpression",
        optional: false,
        computed: false,
        object: {
          type: "Identifier",
          name: obj_arg,
        },
        property: {
          type: "PrivateIdentifier",
          name: key,
        },
      };
    }
    case "set": {
      return {
        type: "AssignmentExpression",
        operator: "=",
        left: {
          type: "MemberExpression",
          optional: false,
          computed: false,
          object: {
            type: "Identifier",
            name: obj_arg,
          },
          property: {
            type: "PrivateIdentifier",
            name: key,
          },
        },
        right: {
          type: "Identifier",
          name: val_arg,
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
 *   operation: "has" | "get" | "set",
 *   key_arg: string,
 * ) => estree.Expression}
 */
const makePrivateCode = (operation, key_arg) => {
  switch (operation) {
    case "has": {
      return concat([
        {
          type: "Literal",
          value: `((obj) => (#`,
        },
        {
          type: "Identifier",
          name: key_arg,
        },
        {
          type: "Literal",
          value: ` in obj));`,
        },
      ]);
    }
    case "get": {
      return concat([
        {
          type: "Literal",
          value: `((obj) => (obj.#`,
        },
        {
          type: "Identifier",
          name: key_arg,
        },
        {
          type: "Literal",
          value: `));`,
        },
      ]);
    }
    case "set": {
      return concat([
        {
          type: "Literal",
          value: `((obj, val) => (obj.#`,
        },
        {
          type: "Identifier",
          name: key_arg,
        },
        {
          type: "Literal",
          value: ` =  val));`,
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
 *   operation: "has" | "get" | "set",
 *   keys: estree.PrivateKey[],
 *   config: import("./config").Config,
 * ) => estree.Expression}
 */
const makeStaticPrivateArrow = (operation, keys, _config) => {
  const obj_arg = "obj";
  const key_arg = "key";
  const val_arg = "val";
  return {
    type: "ArrowFunctionExpression",
    async: false,
    expression: false,
    params: [
      {
        type: "Identifier",
        name: obj_arg,
      },
      {
        type: "Identifier",
        name: key_arg,
      },
      .../** @type {estree.Pattern[]} */ (
        operation === "set"
          ? [
              {
                type: "Identifier",
                name: val_arg,
              },
            ]
          : []
      ),
    ],
    body: {
      type: "BlockStatement",
      body: [
        .../** @type {estree.Statement[]} */ (
          keys.length === 0
            ? []
            : [
                {
                  type: "SwitchStatement",
                  discriminant: {
                    type: "Identifier",
                    name: key_arg,
                  },
                  cases: map(keys, (key) => ({
                    type: "SwitchCase",
                    test: {
                      type: "Literal",
                      value: key,
                    },
                    consequent: [
                      {
                        type: "ReturnStatement",
                        argument: makePrivateNode(
                          operation,
                          obj_arg,
                          key,
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
              name: "TypeError",
            },
            arguments: [
              {
                type: "BinaryExpression",
                operator: "+",
                left: {
                  type: "Literal",
                  value: `missing private key: #`,
                },
                right: {
                  type: "Identifier",
                  name: key_arg,
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
 *   operation: "has" | "get" | "set",
 *   keys: estree.PrivateKey[],
 *   config: import("./config").Config,
 * ) => estree.Expression}
 */
const makeDynamicPrivateArrow = (operation, keys, config) => {
  const key_arg = "key";
  const obj_arg = "obj";
  const val_arg = "val";
  const rec_arg = "rec";
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
        expression: true,
        params:
          operation === "set"
            ? [
                {
                  type: "Identifier",
                  name: obj_arg,
                },
                {
                  type: "Identifier",
                  name: key_arg,
                },
                {
                  type: "Identifier",
                  name: val_arg,
                },
              ]
            : [
                {
                  type: "Identifier",
                  name: obj_arg,
                },
                {
                  type: "Identifier",
                  name: key_arg,
                },
              ],
        body: {
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
              name: "get",
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
                name: key_arg,
              },
            },
            arguments:
              operation === "set"
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
                    name: key_arg,
                  },
                },
                right: {
                  type: "CallExpression",
                  optional: false,
                  callee: {
                    type: "Identifier",
                    name: mangleEval(config.escape),
                  },
                  arguments: [makePrivateCode(operation, key_arg)],
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
                    name: key_arg,
                  },
                },
                arguments:
                  operation === "set"
                    ? [
                        {
                          type: "Identifier",
                          name: obj_arg,
                        },
                        {
                          type: "Identifier",
                          name: val_arg,
                        },
                      ]
                    : [
                        {
                          type: "Identifier",
                          name: obj_arg,
                        },
                      ],
              },
            ],
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
            keys,
            (key) =>
              /** @type {estree.Property} */ ({
                type: "Property",
                kind: "init",
                method: false,
                shorthand: false,
                computed: false,
                key: {
                  type: "Identifier",
                  name: key,
                },
                value: {
                  type: "ArrowFunctionExpression",
                  async: false,
                  expression: true,
                  params:
                    operation === "set"
                      ? [
                          {
                            type: "Identifier",
                            name: obj_arg,
                          },
                          {
                            type: "Identifier",
                            name: val_arg,
                          },
                        ]
                      : [
                          {
                            type: "Identifier",
                            name: obj_arg,
                          },
                        ],
                  body: makePrivateNode(operation, obj_arg, key, val_arg),
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
 *   dynamic: boolean,
 *   operation: "has" | "get" | "set",
 *   head: import("../header").PrivateHeader[],
 *   config: import("./config").Config,
 * ) => [
 *   estree.Identifier,
 *   estree.Expression
 * ][]}
 */
const makePrivateDeclarator = (dynamic, operation, head, config) => {
  /** @type {import("../header").PrivateParameter} */
  const parameter = `private.${operation}`;
  const keys = removeDuplicate(
    map(
      filter(head, ({ type }) => type === parameter),
      getKey,
    ),
  );
  if (keys.length === 0 && !dynamic) {
    return [];
  } else {
    return [
      [
        { type: "Identifier", name: mangleParameter(parameter) },
        dynamic
          ? makeDynamicPrivateArrow(operation, keys, config)
          : makeStaticPrivateArrow(operation, keys, config),
      ],
    ];
  }
};

/**
 * @type {(
 *   dynamic: boolean,
 *   head: import("../header").PrivateHeader[],
 *   config: import("./config").Config,
 * ) => [
 *   estree.Identifier,
 *   estree.Expression
 * ][]}
 */
export const listPrivateDeclarator = (dynamic, head, config) =>
  flatMap(OPERATION, (operation) =>
    makePrivateDeclarator(dynamic, operation, head, config),
  );
