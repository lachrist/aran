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
import { listDeclaration, listDeclarationEntry } from "./head-declare.mjs";
import { listLookupDeclarator } from "./head-lookup.mjs";
import { listStraightDeclarator } from "./head-straight.mjs";
import { listModuleDeclaration } from "./head-module.mjs";
import { listPrivateDeclarator } from "./head-private.mjs";
import { INTRINSIC } from "./mangle.mjs";
import { generateIntrinsicRecord } from "../setup.mjs";

const getFirst = compileGet(0);

const getSecond = compileGet(1);

/**
 * @type {(
 *   node: aran.Program<rebuild.Atom>,
 *   config: import("./config").Config,
 * ) => estree.Program}
 */
export const rebuildProgram = (node, config) => {
  const mode = some(node.head, isSloppyHeader) ? "sloppy" : "strict";
  /** @type {[estree.Identifier, estree.Expression][]} */
  const entries = [
    [
      { type: "Identifier", name: INTRINSIC },
      config.intrinsic !== null
        ? {
            type: "Identifier",
            name: config.intrinsic,
          }
        : generateIntrinsicRecord(config),
    ],
    ...listDeclarationEntry(filterNarrow(node.head, isDeclareHeader), config),
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
      ...listDeclaration(filterNarrow(node.head, isDeclareHeader)),
      {
        type: "ExpressionStatement",
        expression: {
          type: "CallExpression",
          optional: false,
          callee: {
            type: "ArrowFunctionExpression",
            params: map(entries, getFirst),
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
          arguments: map(entries, getSecond),
        },
      },
    ],
  };
};
