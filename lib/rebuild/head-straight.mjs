import { compileGet, map, removeDuplicate } from "../util/index.mjs";
import {
  IMPORT_META,
  NEW_TARGET,
  mangleArgument,
  mangleParameter,
} from "./mangle.mjs";

const getType = compileGet("type");

/**
 * @type {Record<
 *   import("../header").StraightParameter,
 *   (config: import("./config").Config) => estree.Expression
 * >}
 */
const INIT = {
  "this": (_config) => ({
    type: "ThisExpression",
  }),
  "import.dynamic": (config) => ({
    type: "ArrowFunctionExpression",
    async: false,
    expression: true,
    params: [mangleArgument("src", config)],
    body: {
      type: "ImportExpression",
      source: mangleArgument("src", config),
    },
  }),
  "import.meta": (_config) => IMPORT_META,
  "new.target": (_config) => NEW_TARGET,
  "super.get": (config) => ({
    type: "ArrowFunctionExpression",
    async: false,
    expression: true,
    params: [mangleArgument("key", config)],
    body: {
      type: "MemberExpression",
      optional: false,
      computed: true,
      object: {
        type: "Super",
      },
      property: mangleArgument("key", config),
    },
  }),
  "super.set": (config) => ({
    type: "ArrowFunctionExpression",
    async: false,
    expression: true,
    params: [mangleArgument("key", config), mangleArgument("val", config)],
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
        property: mangleArgument("key", config),
      },
      right: mangleArgument("val", config),
    },
  }),
  "super.call": (config) => ({
    type: "ArrowFunctionExpression",
    async: false,
    expression: true,
    params: [mangleArgument("args", config)],
    body: {
      type: "CallExpression",
      optional: false,
      callee: {
        type: "Super",
      },
      arguments: [
        {
          type: "SpreadElement",
          argument: mangleArgument("args", config),
        },
      ],
    },
  }),
};

/**
 * @type {(
 *   parameter: import("../header").StraightParameter,
 *   config: import("./config").Config,
 * ) => [
 *   estree.Identifier,
 *   estree.Expression,
 * ]}
 */
const makeStraightDeclarator = (parameter, config) => {
  const makeInit = INIT[parameter];
  return [mangleParameter(parameter, config), makeInit(config)];
};

/**
 * @type {(
 *   head: import("../header").StraightHeader[],
 *   config: import("./config").Config,
 * ) => [
 *   estree.Identifier,
 *   estree.Expression,
 * ][]}
 */
export const listStraightDeclarator = (head, config) =>
  map(removeDuplicate(map(head, getType)), (parameter) =>
    makeStraightDeclarator(parameter, config),
  );
