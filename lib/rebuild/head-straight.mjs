import { compileGet, filter, includes, listKey, map } from "../util/index.mjs";
import { mangleParameter } from "./mangle.mjs";

const getType = compileGet("type");

const PARAMETERS = listKey(
  /**
   * @type {Record<import("../header").StraightParameter, null>}
   */ ({
    "this": null,
    "import.dynamic": null,
    "import.meta": null,
    "new.target": null,
    "super.get": null,
    "super.set": null,
    "super.call": null,
  }),
);

/**
 * @type {Record<
 *   import("../header").StraightParameter,
 *   estree.Expression
 * >}
 */
const INIT = {
  "this": {
    type: "ThisExpression",
  },
  "import.dynamic": {
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
  },
  "import.meta": {
    type: "MetaProperty",
    meta: {
      type: "Identifier",
      name: "import",
    },
    property: {
      type: "Identifier",
      name: "meta",
    },
  },
  "new.target": {
    type: "MetaProperty",
    meta: {
      type: "Identifier",
      name: "new",
    },
    property: {
      type: "Identifier",
      name: "target",
    },
  },
  "super.get": {
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
      optional: false,
      computed: true,
      object: {
        type: "Super",
      },
      property: {
        type: "Identifier",
        name: "key",
      },
    },
  },
  "super.set": {
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
        optional: false,
        computed: true,
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
  },
  "super.call": {
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
  },
};

/**
 * @type {(
 *   parameter: import("../header").StraightParameter,
 * ) => [
 *   estree.Identifier,
 *   estree.Expression,
 * ]}
 */
const makeStraightDeclarator = (parameter) => [
  { type: "Identifier", name: mangleParameter(parameter) },
  INIT[parameter],
];

/**
 * @type {(
 *   head: import("../header").StraightHeader[],
 *   config: import("./config").Config,
 * ) => [
 *   estree.Identifier,
 *   estree.Expression,
 * ][]}
 */
export const listStraightDeclarator = (head, _config) => {
  const parameters = map(head, getType);
  return map(
    filter(PARAMETERS, (parameter) => includes(parameters, parameter)),
    makeStraightDeclarator,
  );
};
