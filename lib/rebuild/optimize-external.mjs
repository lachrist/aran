import { AranTypeError } from "../report.mjs";
import { KEYWORD_RECORD, STRICT_KEYWORD_RECORD } from "../estree.mjs";
import { listChild } from "../lang.mjs";
import { filter, hasNarrowKey, listValue, map } from "../util/index.mjs";
import { checkClash } from "./clash.mjs";
import { makeIntrinsicExpression } from "./intrinsic.mjs";
import { mangleParameter } from "./mangle.mjs";

const {
  Reflect: { apply },
  RegExp: {
    prototype: { test: testRegExp },
  },
} = globalThis;

export const VARIABLE_REGEXP = /^[\p{ID_Start}$_][\p{ID_Continue}$_]*$/u;

/**
 * @type {(
 *   variable: string,
 * ) => variable is import("../estree").Variable}
 */
export const isVariable = (variable) =>
  apply(testRegExp, VARIABLE_REGEXP, [variable]);

/**
 * @type {(
 *   node: import("./atom").Node,
 * ) => null | import("./optimize-external").Target}
 */
const sniffTarget = (node) => {
  if (node.type === "ReadExpression") {
    const { variable } = node;
    return variable === "scope.read" ||
      variable === "scope.writeStrict" ||
      variable === "scope.writeSloppy" ||
      variable === "scope.typeof" ||
      variable === "scope.discard"
      ? /** @type {import("./optimize-external").Target} */ (variable)
      : null;
  } else if (node.type === "IntrinsicExpression") {
    const { intrinsic } = node;
    return intrinsic === "aran.readGlobal" ||
      intrinsic === "aran.writeGlobalStrict" ||
      intrinsic === "aran.writeGlobalSloppy" ||
      intrinsic === "aran.typeofGlobal" ||
      intrinsic === "aran.discardGlobal"
      ? intrinsic
      : null;
  } else {
    return null;
  }
};

/**
 * @type {(
 *   node: import("./atom").Node,
 * ) => null | import("../estree").Variable}
 */
const sniffVariable = (node) => {
  if (node.type === "PrimitiveExpression") {
    const { primitive } = node;
    return typeof primitive === "string" && isVariable(primitive)
      ? primitive
      : null;
  } else {
    return null;
  }
};

/* eslint-disable local/no-impure */
/**
 * @type {<T>(
 *   root: import("./atom").Program,
 * ) => import("./optimize-external").External[]}
 */
const listExternal = (root) => {
  /** @type {import("./atom").Node[]} */
  const todo = [root];
  /**
   * @type {{
   *   [key in string] ?: import("./optimize-external").External
   * }}
   */
  const externals = /** @type {any} */ ({ __proto__: null });
  let length = 1;
  while (length > 0) {
    length -= 1;
    const node = todo[length];
    if (
      node.type === "ApplyExpression" &&
      (node.arguments.length === 1 || node.arguments.length === 2)
    ) {
      const target = sniffTarget(node.callee);
      if (target !== null) {
        const variable = sniffVariable(node.arguments[0]);
        if (variable !== null) {
          externals[`${target}:${variable}`] = { target, variable };
        }
      }
    }
    if (node.type === "ApplyExpression" && node.arguments.length === 3) {
      const target = sniffTarget(node.arguments[0]);
      if (target !== null) {
        if (
          node.arguments[2].type === "ApplyExpression" &&
          node.arguments[2].callee.type === "IntrinsicExpression" &&
          node.arguments[2].callee.intrinsic === "Array.of" &&
          (node.arguments[2].arguments.length === 1 ||
            node.arguments[2].arguments.length === 2)
        ) {
          const variable = sniffVariable(node.arguments[2].arguments[0]);
          if (variable !== null) {
            externals[`${target}:${variable}`] = { target, variable };
          }
        }
      }
    }
    for (const child of listChild(node)) {
      todo[length] = child;
      length += 1;
    }
  }
  return listValue(externals);
};
/* eslint-enable local/no-impure */

/**
 * @type {(
 *   target: import("./optimize-external").Target,
 *   config: import("./config").Config,
 * ) => import("../estree").Expression}
 */
const makeTargetExpression = (target, config) => {
  if (
    target === "aran.readGlobal" ||
    target === "aran.writeGlobalStrict" ||
    target === "aran.writeGlobalSloppy" ||
    target === "aran.typeofGlobal" ||
    target === "aran.discardGlobal"
  ) {
    return makeIntrinsicExpression(target, config);
  } else if (
    target === "scope.read" ||
    target === "scope.writeStrict" ||
    target === "scope.writeSloppy" ||
    target === "scope.typeof" ||
    target === "scope.discard"
  ) {
    return mangleParameter(target, config);
  } else {
    throw new AranTypeError(target);
  }
};

/**
 * @type {(
 *   variable: import("../estree").Variable,
 * ) => import("../estree").Variable}
 */
const escapeValue = (variable) =>
  /** @type {import("../estree").Variable} */ (
    variable === "value" ? "$value" : "value"
  );

/**
 * @type {(
 *   target: import("./optimize-external").Target,
 *   variable: import("../estree").Variable,
 * ) => import("../estree").Expression}
 */
const makeArrowExpression = (target, variable) => {
  if (target === "scope.read" || target === "aran.readGlobal") {
    return {
      type: "ArrowFunctionExpression",
      async: false,
      generator: false,
      expression: true,
      params: [],
      body: {
        type: "Identifier",
        name: variable,
      },
    };
  } else if (
    target === "scope.writeStrict" ||
    target === "scope.writeSloppy" ||
    target === "aran.writeGlobalStrict" ||
    target === "aran.writeGlobalSloppy"
  ) {
    return {
      type: "ArrowFunctionExpression",
      async: false,
      generator: false,
      expression: true,
      params: [{ type: "Identifier", name: escapeValue(variable) }],
      body: {
        type: "AssignmentExpression",
        operator: "=",
        left: {
          type: "Identifier",
          name: variable,
        },
        right: {
          type: "Identifier",
          name: escapeValue(variable),
        },
      },
    };
  } else if (target === "scope.discard" || target === "aran.discardGlobal") {
    return {
      type: "ArrowFunctionExpression",
      async: false,
      generator: false,
      expression: true,
      params: [],
      body: {
        type: "UnaryExpression",
        operator: "delete",
        prefix: true,
        argument: {
          type: "Identifier",
          name: variable,
        },
      },
    };
  } else if (target === "scope.typeof" || target === "aran.typeofGlobal") {
    return {
      type: "ArrowFunctionExpression",
      async: false,
      generator: false,
      expression: true,
      params: [],
      body: {
        type: "UnaryExpression",
        operator: "typeof",
        prefix: true,
        argument: {
          type: "Identifier",
          name: variable,
        },
      },
    };
  } else {
    throw new AranTypeError(target);
  }
};

/**
 * @type {(
 *   external: import("./optimize-external").External,
 * ) => "strict" | "sloppy" | "either" | "none"}
 */
const getExternalMode = ({ target, variable }) => {
  if (hasNarrowKey(KEYWORD_RECORD, variable)) {
    return "none";
  }
  if (
    target === "aran.writeGlobalSloppy" ||
    target === "scope.writeSloppy" ||
    target === "aran.discardGlobal"
  ) {
    return "sloppy";
  }
  if (target === "aran.writeGlobalStrict" || target === "scope.writeStrict") {
    if (
      hasNarrowKey(STRICT_KEYWORD_RECORD, variable) ||
      variable === "eval" ||
      variable === "arguments"
    ) {
      return "none";
    } else {
      return "strict";
    }
  }
  if (hasNarrowKey(STRICT_KEYWORD_RECORD, variable)) {
    return "sloppy";
  }
  return "either";
};

/**
 * @type {(
 *   external: import("./optimize-external").External,
 *   config: import("./config").Config,
 * ) => import("../estree").Statement}
 */
const makeExternalOptimization = ({ target, variable }, config) => ({
  type: "ExpressionStatement",
  expression: {
    type: "CallExpression",
    optional: false,
    callee: makeTargetExpression(target, config),
    arguments: [
      {
        type: "Literal",
        value: variable,
      },
      {
        type: "Literal",
        value: null,
      },
      makeArrowExpression(target, variable),
    ],
  },
});

/**
 * @type {(
 *   external: import("./optimize-external").External,
 * ) => boolean}
 */
const isSloppyExternal = (external) => getExternalMode(external) === "sloppy";

/**
 * @type {(
 *   external: import("./optimize-external").External,
 * ) => boolean}
 */
const isStrictExternal = (external) => getExternalMode(external) === "strict";

/**
 * @type {(
 *   external: import("./optimize-external").External,
 * ) => boolean}
 */
const isEitherExternal = (external) => getExternalMode(external) === "either";

/**
 * @type {(
 *   root: import("./atom").Program,
 *   config: import("./config").Config,
 * ) => {
 *   sloppy: import("../estree").Statement[],
 *   strict: import("../estree").Statement[],
 *   either: import("../estree").Statement[],
 * }}
 */
export const listExternalOptimization = (root, config) => {
  const externals = filter(
    listExternal(root),
    ({ variable }) => checkClash(variable, config) === null,
  );
  return {
    sloppy: map(filter(externals, isSloppyExternal), (external) =>
      makeExternalOptimization(external, config),
    ),
    strict: map(filter(externals, isStrictExternal), (external) =>
      makeExternalOptimization(external, config),
    ),
    either: map(filter(externals, isEitherExternal), (external) =>
      makeExternalOptimization(external, config),
    ),
  };
};
