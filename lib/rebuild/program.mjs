import {
  isDeclareHeader,
  isPrivateHeader,
  isModuleHeader,
  isStraightHeader,
  isLookupHeader,
  isSloppyHeader,
} from "../header.mjs";
import { compileGet, filterNarrow, map, some } from "../util/index.mjs";
import { rebuildClosureBlock } from "./block.mjs";
import { makeDeclaration } from "./head-declare.mjs";
import { listLookupDeclarator } from "./head-lookup.mjs";
import { listStraightDeclarator } from "./head-straight.mjs";
import { listModuleDeclaration } from "./head-module.mjs";
import { listPrivateDeclarator } from "./head-private.mjs";
import { INTRINSIC, mangleParameter } from "./mangle.mjs";
import { generateIntrinsicRecord } from "../setup.mjs";

const getFirst = compileGet(0);

const getSecond = compileGet(1);

/**
 * @type {(
 *   parameter: aran.Parameter,
 * ) => estree.Pattern}
 */
const makeParameter = (parameter) => ({
  type: "Identifier",
  name: mangleParameter(parameter),
});

/**
 * @type {(
 *   node: aran.Program<rebuild.Atom>,
 *   config: import("./config").Config,
 * ) => estree.Program}
 */
export const rebuildProgram = (node, config) => {
  const mode = some(node.head, isSloppyHeader) ? "sloppy" : "strict";
  const entries = [
    ...listStraightDeclarator(
      filterNarrow(node.head, isStraightHeader),
      config,
    ),
    ...listLookupDeclarator(filterNarrow(node.head, isLookupHeader), config),
    ...listPrivateDeclarator(filterNarrow(node.head, isPrivateHeader), config),
  ];
  return {
    type: "Program",
    sourceType: some(node.head, isModuleHeader) ? "module" : "script",
    body: [
      ...(mode === "strict"
        ? [
            /** @type {estree.Directive} */ ({
              type: "ExpressionStatement",
              expression: {
                type: "Literal",
                value: "use strict",
              },
              directive: "use strict",
            }),
          ]
        : []),
      ...listModuleDeclaration(filterNarrow(node.head, isModuleHeader), config),
      ...map(filterNarrow(node.head, isDeclareHeader), makeDeclaration),
      {
        type: "ExpressionStatement",
        expression: {
          type: "CallExpression",
          optional: false,
          callee: {
            type: "ArrowFunctionExpression",
            params: [
              {
                type: "Identifier",
                name: INTRINSIC,
              },
              ...map(map(entries, getFirst), makeParameter),
            ],
            async: false,
            expression: false,
            body: {
              type: "BlockStatement",
              body: [
                ...(mode === "sloppy"
                  ? [
                      /** @type {estree.Directive} */ ({
                        type: "ExpressionStatement",
                        expression: {
                          type: "Literal",
                          value: "use strict",
                        },
                        directive: "use strict",
                      }),
                    ]
                  : []),
                ...rebuildClosureBlock(node.body, config),
              ],
            },
          },
          arguments: [
            config.intrinsic !== null
              ? {
                  type: "Identifier",
                  name: config.intrinsic,
                }
              : generateIntrinsicRecord(config),
            ...map(entries, getSecond),
          ],
        },
      },
    ],
  };
};
