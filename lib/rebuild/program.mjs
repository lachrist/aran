import {
  isDeclareHeader,
  isPrivateHeader,
  isModuleHeader,
  isStraightHeader,
  isLookupHeader,
  isEvalHeader,
} from "../header.mjs";
import { compileGet, filterNarrow, guard, map, some } from "../util/index.mjs";
import { rebuildClosureBlock } from "./block.mjs";
import { listDeclaration } from "./head-declare.mjs";
import { listLookupDeclarator } from "./head-lookup.mjs";
import { listStraightDeclarator } from "./head-straight.mjs";
import { listModuleDeclaration } from "./head-module.mjs";
import { listPrivateDeclarator } from "./head-private.mjs";
import { makeIntrinsicDeclarator } from "./intrinsic.mjs";
import { makeEvalDeclaration } from "./head-eval.mjs";

const getFirst = compileGet(0);

const getSecond = compileGet(1);

/**
 * @type {(
 *   node: aran.Program<rebuild.Atom>,
 *   config: import("./config").Config,
 * ) => estree.Program}
 */
export const rebuildProgram = (node, config) => {
  const dynamic = some(node.head, isEvalHeader);
  /** @type {[estree.Identifier, estree.Expression][]} */
  const entries = [
    makeIntrinsicDeclarator(config),
    ...listStraightDeclarator(
      filterNarrow(node.head, isStraightHeader),
      config,
    ),
    ...listLookupDeclarator(
      dynamic,
      filterNarrow(node.head, isLookupHeader),
      config,
    ),
    ...listPrivateDeclarator(
      dynamic,
      filterNarrow(node.head, isPrivateHeader),
      config,
    ),
  ];
  return {
    type: "Program",
    sourceType: node.kind,
    body: [
      ...(node.mode === "strict"
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
      ...(dynamic ? [makeEvalDeclaration(node.mode, config)] : []),
      ...listModuleDeclaration(filterNarrow(node.head, isModuleHeader), config),
      ...listDeclaration(filterNarrow(node.head, isDeclareHeader), config),
      guard(
        dynamic,
        (completion) => ({
          type: "BlockStatement",
          body: [makeEvalDeclaration(node.mode, config), completion],
        }),
        /** @type {estree.Statement} */ ({
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
                  ...(node.mode === "sloppy"
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
        }),
      ),
    ],
  };
};
