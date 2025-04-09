import { AranTypeError } from "../error.mjs";
import { KEYWORD_RECORD, STRICT_KEYWORD_RECORD } from "estree-sentry";
import { listChild } from "../lang/index.mjs";
import { filter, hasNarrowKey, listValue, map } from "../util/index.mjs";
import { checkClash } from "./clash.mjs";
import { makeIntrinsicExpression } from "./intrinsic.mjs";
import { mangleParameter } from "./mangle.mjs";
import { makeSimpleLiteral } from "./literal.mjs";

const {
  Array: { isArray },
  Reflect: { apply },
  RegExp: {
    prototype: { test: testRegExp },
  },
} = globalThis;

export const VARIABLE_REGEXP = /^[\p{ID_Start}$_][\p{ID_Continue}$_]*$/u;

/**
 * @type {(
 *   variable: string,
 * ) => variable is import("estree-sentry").VariableName}
 */
export const isVariable = (variable) =>
  apply(testRegExp, VARIABLE_REGEXP, [variable]);

/**
 * @type {(
 *   node: import("./atom.d.ts").Node,
 * ) => null | import("./optimize-external.d.ts").Target}
 */
const sniffTarget = (node) => {
  if (node.type === "ReadExpression") {
    const { variable } = node;
    return variable === "scope.read" ||
      variable === "scope.writeStrict" ||
      variable === "scope.writeSloppy" ||
      variable === "scope.typeof" ||
      variable === "scope.discard"
      ? /** @type {import("./optimize-external.d.ts").Target} */ (variable)
      : null;
  } else if (node.type === "IntrinsicExpression") {
    const { intrinsic } = node;
    return intrinsic === "aran.readGlobalVariable" ||
      intrinsic === "aran.writeGlobalVariableStrict" ||
      intrinsic === "aran.writeGlobalVariableSloppy" ||
      intrinsic === "aran.typeofGlobalVariable" ||
      intrinsic === "aran.discardGlobalVariable"
      ? intrinsic
      : null;
  } else {
    return null;
  }
};

/**
 * @type {(
 *   node: import("./atom.d.ts").Node,
 * ) => null | import("estree-sentry").VariableName}
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
 * @type {(
 *   root: import("./atom.d.ts").Program,
 * ) => import("./optimize-external.d.ts").External[]}
 */
const listExternal = (root) => {
  /**
   * @type {{
   *   [key in string] ?: import("./optimize-external.d.ts").External
   * }}
   */
  const externals = /** @type {any} */ ({ __proto__: null });
  /**
   * @type {(
   *   node: import("../util/tree.d.ts").Tree<import("./atom.d.ts").Node>,
   * ) => void}
   */
  const loop = (node) => {
    if (node === null) {
      // noop
    } else if (isArray(node)) {
      const { length } = node;
      for (let index = 0; index < length; index++) {
        loop(node[index]);
      }
    } else {
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
      loop(listChild(node));
    }
  };
  loop(root);
  return listValue(externals);
};
/* eslint-enable local/no-impure */

/**
 * @type {(
 *   target: import("./optimize-external.d.ts").Target,
 *   config: import("./config-internal.d.ts").InternalConfig,
 * ) => import("estree-sentry").Expression<{}>}
 */
const makeTargetExpression = (target, config) => {
  if (
    target === "aran.readGlobalVariable" ||
    target === "aran.writeGlobalVariableStrict" ||
    target === "aran.writeGlobalVariableSloppy" ||
    target === "aran.typeofGlobalVariable" ||
    target === "aran.discardGlobalVariable"
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
 *   variable: import("estree-sentry").VariableName,
 * ) => import("estree-sentry").VariableName}
 */
const escapeValue = (variable) =>
  /** @type {import("estree-sentry").VariableName} */ (
    variable === "value" ? "$value" : "value"
  );

/**
 * @type {(
 *   target: import("./optimize-external.d.ts").Target,
 *   variable: import("estree-sentry").VariableName,
 * ) => import("estree-sentry").Expression<{}>}
 */
const makeArrowExpression = (target, variable) => {
  if (target === "scope.read" || target === "aran.readGlobalVariable") {
    return {
      type: "ArrowFunctionExpression",
      id: null,
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
    target === "aran.writeGlobalVariableStrict" ||
    target === "aran.writeGlobalVariableSloppy"
  ) {
    return {
      type: "ArrowFunctionExpression",
      id: null,
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
  } else if (
    target === "scope.discard" ||
    target === "aran.discardGlobalVariable"
  ) {
    return {
      type: "ArrowFunctionExpression",
      id: null,
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
  } else if (
    target === "scope.typeof" ||
    target === "aran.typeofGlobalVariable"
  ) {
    return {
      type: "ArrowFunctionExpression",
      id: null,
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
 *   external: import("./optimize-external.d.ts").External,
 * ) => "strict" | "sloppy" | "either" | "none"}
 */
const getExternalMode = ({ target, variable }) => {
  if (hasNarrowKey(KEYWORD_RECORD, variable)) {
    return "none";
  }
  if (
    target === "aran.writeGlobalVariableSloppy" ||
    target === "scope.writeSloppy" ||
    target === "aran.discardGlobalVariable"
  ) {
    return "sloppy";
  }
  if (
    target === "aran.writeGlobalVariableStrict" ||
    target === "scope.writeStrict"
  ) {
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
 *   external: import("./optimize-external.d.ts").External,
 *   config: import("./config-internal.d.ts").InternalConfig,
 * ) => import("estree-sentry").Statement<{}>}
 */
const makeExternalOptimization = ({ target, variable }, config) => ({
  type: "ExpressionStatement",
  directive: null,
  expression: {
    type: "CallExpression",
    optional: false,
    callee: makeTargetExpression(target, config),
    arguments: [
      makeSimpleLiteral(variable),
      makeSimpleLiteral(null),
      makeArrowExpression(target, variable),
    ],
  },
});

/**
 * @type {(
 *   external: import("./optimize-external.d.ts").External,
 * ) => boolean}
 */
const isSloppyExternal = (external) => getExternalMode(external) === "sloppy";

/**
 * @type {(
 *   external: import("./optimize-external.d.ts").External,
 * ) => boolean}
 */
const isStrictExternal = (external) => getExternalMode(external) === "strict";

/**
 * @type {(
 *   external: import("./optimize-external.d.ts").External,
 * ) => boolean}
 */
const isEitherExternal = (external) => getExternalMode(external) === "either";

/**
 * @type {(
 *   root: import("./atom.d.ts").Program,
 *   config: import("./config-internal.d.ts").InternalConfig,
 * ) => {
 *   sloppy: import("estree-sentry").Statement<{}>[],
 *   strict: import("estree-sentry").Statement<{}>[],
 *   either: import("estree-sentry").Statement<{}>[],
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
