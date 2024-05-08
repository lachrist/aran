import { filterNarrow, map, some } from "../util/index.mjs";
import { rebuildClosureBlock } from "./block.mjs";
import { listModuleDeclaration } from "./program-module.mjs";
import { AranError, AranTypeError } from "../error.mjs";
import { makeProgramParameterDeclaration } from "./program-parameter.mjs";
import { mangleExternal } from "./mangle.mjs";
import { isDeclareHeader, isModuleHeader, isSloppyHeader } from "../header.mjs";
import { makeIntrinsicDeclarator } from "./intrinsic.mjs";

/**
 * @type {(
 *   header: import("../header").DeclareHeader,
 *   config: import("./config").Config,
 * ) => estree.Statement}
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
 *   node: aran.Program<rebuild.Atom>,
 *   config: import("./config").Config,
 * ) => estree.Program}
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
          ...rebuildClosureBlock(node.body, config, {
            completion: "expression",
          }),
        ],
      };
    }
  } else if (node.kind === "script" || node.kind === "eval") {
    if (some(node.head, isSloppyHeader) && node.situ !== "local.deep") {
      return {
        type: "Program",
        sourceType: "script",
        body: [
          makeIntrinsicDeclarator(config),
          ...map(filterNarrow(node.head, isDeclareHeader), (header) =>
            declare(header, config),
          ),
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
                    /** @type {estree.Directive} */ ({
                      type: "ExpressionStatement",
                      directive: "use strict",
                      expression: {
                        type: "Literal",
                        value: "use strict",
                      },
                    }),
                    ...rebuildClosureBlock(node.body, config, {
                      completion: "return",
                    }),
                  ],
                },
              },
              arguments: [],
            },
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
          makeIntrinsicDeclarator(config),
          ...map(filterNarrow(node.head, isDeclareHeader), (header) =>
            declare(header, config),
          ),
          ...makeProgramParameterDeclaration(node, config),
          ...rebuildClosureBlock(node.body, config, {
            completion: "expression",
          }),
        ],
      };
    }
  } else {
    throw new AranTypeError(node);
  }
};
