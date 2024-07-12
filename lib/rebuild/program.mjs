import { concatXX_, filterNarrow, map } from "../util/index.mjs";
import { listModuleDeclaration } from "./program-module.mjs";
import { AranClashError, AranTypeError } from "../error.mjs";
import { listProgramParameterDeclaration } from "./program-parameter.mjs";
import { formatClashMessage } from "./mangle.mjs";
import { isDeclareHeader, isModuleHeader } from "../header.mjs";
import { makeIntrinsicDeclarator } from "./intrinsic.mjs";
import { listDeclaration } from "./declaration.mjs";
import { rebuildStatement } from "./statement.mjs";
import { rebuildExpression } from "./expression.mjs";
import { listExternalOptimization } from "./optimize-external.mjs";

/**
 * @type {(
 *   header: import("../header").DeclareHeader,
 *   config: import("./config").Config,
 * ) => import("../estree").Statement}
 */
export const declare = ({ kind, variable }, config) => {
  const message = formatClashMessage(variable, config);
  if (message === null) {
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
  } else {
    throw new AranClashError(message);
  }
};

/**
 * @type {(
 *   expression: import("../estree").Expression,
 * ) => import("../estree").Statement}
 */
const makeReturnStatement = (argument) => ({
  type: "ReturnStatement",
  argument,
});

/**
 * @type {(
 *   expression: import("../estree").Expression,
 * ) => import("../estree").Statement}
 */
const makeExpressionStatement = (expression) => ({
  type: "ExpressionStatement",
  expression,
});

/**
 * @type {(
 *   node: import("./atom").RoutineBlock,
 *   config: import("./config").Config,
 *   makeCompletion: (
 *     expression: import("../estree").Expression,
 *   ) => import("../estree").Statement
 * ) => import("../estree").Statement[]}
 */
const rebuildRoutineBlock = (node, config, makeCompletion) =>
  concatXX_(
    listDeclaration(node.bindings, config),
    map(node.body, (child) => rebuildStatement(child, config)),
    makeCompletion(rebuildExpression(node.tail, config)),
  );

/**
 * @type {(
 *   node: import("./atom").Program,
 *   config: import("./config").Config,
 *   optimization: import("./optimize-external").Optimization,
 * ) => import("../estree").Program}
 */
const makeModuleProgram = (node, config, optimization) => ({
  type: "Program",
  sourceType: "module",
  body: [
    makeIntrinsicDeclarator(config),
    ...listModuleDeclaration(filterNarrow(node.head, isModuleHeader), config),
    ...listProgramParameterDeclaration(node, config),
    ...optimization.strict,
    ...optimization.either,
    ...rebuildRoutineBlock(node.body, config, makeExpressionStatement),
  ],
});

/**
 * @type {(
 *   node: import("./atom").Program,
 *   config: import("./config").Config,
 *   optimization: import("./optimize-external").Optimization,
 * ) => import("../estree").Program}
 */
const makeStrictScriptProgram = (node, config, optimizations) => ({
  type: "Program",
  sourceType: "script",
  body: [
    {
      type: "ExpressionStatement",
      directive: "use strict",
      expression: {
        type: "Literal",
        value: "use strict",
      },
    },
    ...map(filterNarrow(node.head, isDeclareHeader), (header) =>
      declare(header, config),
    ),
    {
      type: "BlockStatement",
      body: [
        makeIntrinsicDeclarator(config),
        ...listProgramParameterDeclaration(node, config),
        ...optimizations.strict,
        ...rebuildRoutineBlock(node.body, config, makeExpressionStatement),
      ],
    },
  ],
});

/**
 * @type {(
 *   node: import("./atom").Program,
 *   config: import("./config").Config,
 *   optimization: import("./optimize-external").Optimization,
 * ) => import("../estree").Program}
 */
const makeSloppyScriptProgram = (node, config, optimization) => ({
  type: "Program",
  sourceType: "script",
  body: [
    ...map(filterNarrow(node.head, isDeclareHeader), (header) =>
      declare(header, config),
    ),
    {
      type: "BlockStatement",
      body: [
        makeIntrinsicDeclarator(config),
        ...listProgramParameterDeclaration(node, config),
        ...optimization.sloppy,
        {
          type: "ExpressionStatement",
          expression: {
            type: "CallExpression",
            optional: false,
            callee: {
              type: "ArrowFunctionExpression",
              params: [],
              async: false,
              expression: false,
              body: {
                type: "BlockStatement",
                body: [
                  /** @type {import("../estree").Directive} */ ({
                    type: "ExpressionStatement",
                    directive: "use strict",
                    expression: {
                      type: "Literal",
                      value: "use strict",
                    },
                  }),
                  ...optimization.strict,
                  ...optimization.either,
                  ...rebuildRoutineBlock(
                    node.body,
                    config,
                    makeReturnStatement,
                  ),
                ],
              },
            },
            arguments: [],
          },
        },
      ],
    },
  ],
});

/**
 * @type {(
 *   node: import("./atom").Program,
 *   config: import("./config").Config,
 * ) => import("../estree").Program}
 */
export const rebuildProgram = (node, config) => {
  const optimization = listExternalOptimization(node, config);
  if (node.kind === "module") {
    return makeModuleProgram(node, config, optimization);
  } else if (node.kind === "script" || node.kind === "eval") {
    if (node.situ === "local.root") {
      return makeSloppyScriptProgram(node, config, optimization);
    } else if (node.situ === "local.deep") {
      return makeStrictScriptProgram(node, config, optimization);
    } else if (node.situ === "global") {
      if (optimization.sloppy.length === 0) {
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
