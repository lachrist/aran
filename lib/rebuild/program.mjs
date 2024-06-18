import { concatXX_, filterNarrow, map, some } from "../util/index.mjs";
import { listModuleDeclaration } from "./program-module.mjs";
import { AranError, AranTypeError } from "../error.mjs";
import { makeProgramParameterDeclaration } from "./program-parameter.mjs";
import { mangleExternal } from "./mangle.mjs";
import { isDeclareHeader, isModuleHeader, isSloppyHeader } from "../header.mjs";
import { makeIntrinsicDeclarator } from "./intrinsic.mjs";
import { listDeclaration } from "./declaration.mjs";
import { rebuildStatement } from "./statement.mjs";
import { rebuildExpression } from "./expression.mjs";

/**
 * @type {(
 *   header: import("../header").DeclareHeader,
 *   config: import("./config").Config,
 * ) => import("../estree").Statement}
 */
export const declare = ({ kind, variable }, config) => ({
  type: "VariableDeclaration",
  kind,
  declarations: [
    {
      type: "VariableDeclarator",
      id: mangleExternal(variable, config),
      init: null,
    },
  ],
});

/**
 * @type {(
 *   node: import("./atom").RoutineBlock,
 *   config: import("./config").Config,
 * ) => import("../estree").Statement[]}
 */
const rebuildProgramBlock = (node, config) =>
  concatXX_(
    listDeclaration(node.bindings, config),
    map(node.body, (child) => rebuildStatement(child, config)),
    {
      type: "ExpressionStatement",
      expression: rebuildExpression(node.tail, config),
    },
  );

/**
 * @type {(
 *   node: import("./atom").Program,
 *   config: import("./config").Config,
 * ) => import("../estree").Program}
 */
export const rebuildProgram = (node, config) => {
  if (node.kind === "module") {
    if (some(node.head, isSloppyHeader)) {
      throw new AranError("presence of sloppy header in module", {
        node,
        config,
      });
    } else {
      return {
        type: "Program",
        sourceType: "module",
        body: [
          makeIntrinsicDeclarator(config),
          ...listModuleDeclaration(
            filterNarrow(node.head, isModuleHeader),
            config,
          ),
          ...makeProgramParameterDeclaration(node, config),
          ...rebuildProgramBlock(node.body, config),
        ],
      };
    }
  } else if (node.kind === "script" || node.kind === "eval") {
    if (some(node.head, isSloppyHeader) && node.situ !== "local.deep") {
      return {
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
              ...makeProgramParameterDeclaration(node, config),
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
                        ...rebuildProgramBlock(node.body, config),
                      ],
                    },
                  },
                  arguments: [],
                },
              },
            ],
          },
        ],
      };
    } else {
      return {
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
              ...makeProgramParameterDeclaration(node, config),
              ...rebuildProgramBlock(node.body, config),
            ],
          },
        ],
      };
    }
  } else {
    throw new AranTypeError(node);
  }
};
