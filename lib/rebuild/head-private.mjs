import { AranTypeError } from "../error.mjs";
import { isDynamicHeader, isStaticPrivateHeader } from "../header.mjs";
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
  mangleKey,
  mangleParameter,
} from "./mangle.mjs";

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
 *   obj_arg: estree.Identifier,
 *   key: estree.PrivateKey,
 *   val_arg: estree.Identifier,
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
        right: obj_arg,
      };
    }
    case "get": {
      return {
        type: "MemberExpression",
        optional: false,
        computed: false,
        object: obj_arg,
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
          object: obj_arg,
          property: {
            type: "PrivateIdentifier",
            name: key,
          },
        },
        right: val_arg,
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
 *   key_arg: estree.Identifier,
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
        key_arg,
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
        key_arg,
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
        key_arg,
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
 *   mode: "strict" | "sloppy",
 *   operation: "has" | "get" | "set",
 *   keys: estree.PrivateKey[],
 *   config: import("./config").Config,
 * ) => estree.Expression}
 */
const makeStaticPrivateArrow = (_mode, operation, keys, config) => {
  const obj_arg = mangleArgument("obj", config);
  const key_arg = mangleArgument("key", config);
  const val_arg = mangleArgument("val", config);
  return {
    type: "ArrowFunctionExpression",
    async: false,
    expression: false,
    params:
      operation === "set" ? [obj_arg, key_arg, val_arg] : [obj_arg, key_arg],
    body: {
      type: "BlockStatement",
      body: [
        .../** @type {estree.Statement[]} */ (
          keys.length === 0
            ? []
            : [
                {
                  type: "SwitchStatement",
                  discriminant: key_arg,
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
            callee: makeIntrinsicExpression("TypeError", config),
            arguments: [
              {
                type: "BinaryExpression",
                operator: "+",
                left: {
                  type: "Literal",
                  value: `missing private key: #`,
                },
                right: key_arg,
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
 *   operation: "has" | "get" | "set",
 *   keys: estree.PrivateKey[],
 *   config: import("./config").Config,
 * ) => estree.Expression}
 */
const makeDynamicPrivateArrow = (mode, operation, keys, config) => {
  const key_arg = mangleArgument("key", config);
  const obj_arg = mangleArgument("obj", config);
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
        expression: true,
        params:
          operation === "set"
            ? [obj_arg, key_arg, val_arg]
            : [obj_arg, key_arg],
        body: {
          type: "ConditionalExpression",
          test: {
            type: "BinaryExpression",
            operator: "in",
            left: key_arg,
            right: rec_arg,
          },
          consequent: {
            type: "CallExpression",
            optional: false,
            callee: {
              type: "MemberExpression",
              computed: true,
              optional: false,
              object: rec_arg,
              property: key_arg,
            },
            arguments: operation === "set" ? [val_arg] : [],
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
                  property: key_arg,
                },
                right: {
                  type: "CallExpression",
                  optional: false,
                  callee: mangleEval(mode, config),
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
                  object: rec_arg,
                  property: key_arg,
                },
                arguments: operation === "set" ? [obj_arg, val_arg] : [obj_arg],
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
            key: mangleKey(/** @type {estree.Key} */ ("__proto__")),
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
                key: mangleKey(
                  /** @type {estree.Key} */ (/** @type {string} */ (key)),
                ),
                value: {
                  type: "ArrowFunctionExpression",
                  async: false,
                  expression: true,
                  params: operation === "set" ? [obj_arg, val_arg] : [obj_arg],
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
 *   mode: "strict" | "sloppy",
 *   operation: "has" | "get" | "set",
 *   head: import("../header").PrivateHeader[],
 *   config: import("./config").Config,
 * ) => [
 *   estree.Identifier,
 *   estree.Expression
 * ][]}
 */
const makePrivateDeclarator = (mode, operation, head, config) => {
  if (head.length === 0) {
    return [];
  } else {
    const keys = removeDuplicate(
      map(filterNarrow(head, isStaticPrivateHeader), getKey),
    );
    return [
      [
        mangleParameter(`private.${operation}`, config),
        some(head, isDynamicHeader)
          ? makeDynamicPrivateArrow(mode, operation, keys, config)
          : makeStaticPrivateArrow(mode, operation, keys, config),
      ],
    ];
  }
};

/**
 * @type {(
 *   mode: "strict" | "sloppy",
 *   head: import("../header").PrivateHeader[],
 *   config: import("./config").Config,
 * ) => [
 *   estree.Identifier,
 *   estree.Expression
 * ][]}
 */
export const listPrivateDeclarator = (mode, head, config) =>
  flatMap(OPERATION, (operation) =>
    makePrivateDeclarator(
      mode,
      operation,
      filter(head, (header) => header.type === `private.${operation}`),
      config,
    ),
  );
