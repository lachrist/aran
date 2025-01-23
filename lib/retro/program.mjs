import { every, flatenTree, hasNarrowKey, map } from "../util/index.mjs";
import { makeModuleDeclaration } from "./program-module.mjs";
import { AranTypeError, AranClashError } from "../error.mjs";
import { listProgramParameterDeclaration } from "./program-parameter.mjs";
import { isModuleHeader } from "../lang/index.mjs";
import { makeIntrinsicDeclarator } from "./intrinsic.mjs";
import { listDeclaration } from "./declaration.mjs";
import { retroStatement } from "./statement.mjs";
import { retroExpression } from "./expression.mjs";
import { listExternalOptimization } from "./optimize-external.mjs";
import { STRICT_KEYWORD_RECORD } from "estree-sentry";
import { checkClash } from "./clash.mjs";
import { makeSimpleLiteral } from "./literal.mjs";

/**
 * @type {(
 *   header: import("../lang/header").DeclareHeader,
 *   config: import("./config-internal").InternalConfig,
 * ) => import("estree-sentry").Statement<{}>}
 */
export const declare = ({ kind, variable }, config) => {
  const clash = checkClash(variable, config);
  if (clash) {
    throw new AranClashError(clash);
  } else {
    return {
      type: "VariableDeclaration",
      kind,
      declarations: [
        {
          type: "VariableDeclarator",
          id: {
            type: "Identifier",
            name: variable,
          },
          init: null,
        },
      ],
    };
  }
};

/**
 * @type {(
 *   expression: import("estree-sentry").Expression<{}>,
 * ) => import("estree-sentry").Statement<{}>}
 */
const makeReturnStatement = (argument) => ({
  type: "ReturnStatement",
  argument,
});

/**
 * @type {(
 *   expression: import("estree-sentry").Expression<{}>,
 * ) => import("estree-sentry").Statement<{}>}
 */
const makeExpressionStatement = (expression) => ({
  type: "ExpressionStatement",
  directive: null,
  expression,
});

/**
 * @type {(
 *   node: import("./atom").RoutineBlock,
 *   config: import("./config-internal").InternalConfig,
 *   makeCompletion: (
 *     expression: import("estree-sentry").Expression<{}>,
 *   ) => import("estree-sentry").Statement<{}>
 * ) => import("../util/tree").Tree<import("estree-sentry").Statement<{}>>}
 */
const retroRoutineBlock = (node, config, makeCompletion) => [
  listDeclaration(node.bindings, config),
  map(node.body, (child) => retroStatement(child, config)),
  makeCompletion(retroExpression(node.tail, config)),
];

/**
 * @type {(
 *   node: import("./atom").Program,
 *   config: import("./config-internal").InternalConfig,
 *   optimization: import("./optimize-external").Optimization,
 * ) => import("estree-sentry").Program<{}>}
 */
const makeModuleProgram = (node, config, optimization) => ({
  type: "Program",
  sourceType: "module",
  body: flatenTree([
    makeIntrinsicDeclarator(config),
    map(
      /** @type {import("../lang/header").Header[]} */ (node.head),
      (header) =>
        isModuleHeader(header) ? makeModuleDeclaration(header, config) : null,
    ),
    listProgramParameterDeclaration(node, config),
    optimization.strict,
    optimization.either,
    retroRoutineBlock(node.body, config, makeExpressionStatement),
  ]),
});

/**
 * @type {(
 *   node: import("./atom").Program,
 *   config: import("./config-internal").InternalConfig,
 *   optimization: import("./optimize-external").Optimization,
 * ) => import("estree-sentry").Program<{}>}
 */
const makeStrictScriptProgram = (node, config, optimizations) => ({
  type: "Program",
  sourceType: "script",
  body: flatenTree([
    {
      type: "ExpressionStatement",
      directive: /** @type {import("estree-sentry").Directive} */ (
        "use strict"
      ),
      expression: makeSimpleLiteral("use strict"),
    },
    map(
      /** @type {import("../lang/header").Header[]} */ (node.head),
      (header) => (header.type === "declare" ? declare(header, config) : null),
    ),
    {
      type: "BlockStatement",
      body: flatenTree([
        makeIntrinsicDeclarator(config),
        listProgramParameterDeclaration(node, config),
        optimizations.strict,
        retroRoutineBlock(node.body, config, makeExpressionStatement),
      ]),
    },
  ]),
});

/**
 * @type {(
 *   node: import("./atom").Program,
 *   config: import("./config-internal").InternalConfig,
 *   optimization: import("./optimize-external").Optimization,
 * ) => import("estree-sentry").Program<{}>}
 */
const makeSloppyScriptProgram = (node, config, optimization) => ({
  type: "Program",
  sourceType: "script",
  body: flatenTree([
    map(
      /** @type {import("../lang/header").Header[]} */ (node.head),
      (header) => (header.type === "declare" ? declare(header, config) : null),
    ),
    {
      type: "BlockStatement",
      body: flatenTree([
        makeIntrinsicDeclarator(config),
        listProgramParameterDeclaration(node, config),
        optimization.sloppy,
        {
          type: "ExpressionStatement",
          directive: null,
          expression: {
            type: "CallExpression",
            optional: false,
            callee: {
              type: "ArrowFunctionExpression",
              id: null,
              params: [],
              async: false,
              expression: false,
              generator: false,
              body: {
                type: "BlockStatement",
                body: flatenTree([
                  {
                    type: "ExpressionStatement",
                    directive:
                      /** @type {import("estree-sentry").Directive} */ (
                        "use strict"
                      ),
                    expression: makeSimpleLiteral("use strict"),
                  },
                  optimization.strict,
                  optimization.either,
                  retroRoutineBlock(node.body, config, makeReturnStatement),
                ]),
              },
            },
            arguments: [],
          },
        },
      ]),
    },
  ]),
});

/**
 * @type {(
 *   header: import("../lang/header").DeclareHeader,
 * ) => boolean}
 */
const canBeStrictDeclaration = ({ variable }) =>
  variable !== "eval" &&
  variable !== "arguments" &&
  !hasNarrowKey(STRICT_KEYWORD_RECORD, variable);

/**
 * @type {(
 *   node: import("./atom").Program,
 *   config: import("./config-internal").InternalConfig,
 * ) => import("estree-sentry").Program<{}>}
 */
export const retroProgram = (node, config) => {
  const optimization = listExternalOptimization(node, config);
  if (node.kind === "module") {
    return makeModuleProgram(node, config, optimization);
  } else if (node.kind === "script" || node.kind === "eval") {
    if (node.situ === "local.root") {
      return makeSloppyScriptProgram(node, config, optimization);
    } else if (node.situ === "local.deep") {
      return makeStrictScriptProgram(node, config, optimization);
    } else if (node.situ === "global") {
      if (
        optimization.sloppy.length === 0 &&
        every(node.head, canBeStrictDeclaration)
      ) {
        return makeStrictScriptProgram(node, config, optimization);
      } else {
        return makeSloppyScriptProgram(node, config, optimization);
      }
    } else {
      throw new AranTypeError(node);
    }
  } else {
    throw new AranTypeError(node);
  }
};
