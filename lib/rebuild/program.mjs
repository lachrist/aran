import {
  isPrivateHeader,
  isModuleHeader,
  isStraightHeader,
  isLookupHeader,
  isLateStaticDeclareHeader,
  isEarlyStaticDeclareHeader,
  isDynamicHeader,
} from "../header.mjs";
import { compileGet, filterNarrow, guard, map, some } from "../util/index.mjs";
import { rebuildClosureBlock } from "./block.mjs";
import { listEarlyDeclaration, makeLateDeclaration } from "./head-declare.mjs";
import { listLookupDeclarator } from "./head-lookup.mjs";
import { listStraightDeclarator } from "./head-straight.mjs";
import { listModuleDeclaration } from "./head-module.mjs";
import { listPrivateDeclarator } from "./head-private.mjs";
import { makeIntrinsicDeclarator } from "./intrinsic.mjs";
import { makeEvalDeclaration } from "./head-eval.mjs";
import { isInternalLocalEvalSort } from "../sort.mjs";

const getFirst = compileGet(0);

const getSecond = compileGet(1);

/**
 * @type {(
 *   node: aran.Program<rebuild.Atom>,
 *   config: import("./config").Config,
 * ) => estree.Program}
 */
export const rebuildProgram = (node, config) => {
  if (isInternalLocalEvalSort(node.sort)) {
    return {
      type: "Program",
      sourceType: "script",
      body: [
        ...makeLateDeclaration(
          filterNarrow(node.head, isLateStaticDeclareHeader),
          config,
        ),
        ...rebuildClosureBlock(node.body, config, {
          completion: "expression",
        }),
      ],
    };
  } else {
    /** @type {[estree.Identifier, estree.Expression][]} */
    const entries = [
      makeIntrinsicDeclarator(config),
      ...listStraightDeclarator(
        filterNarrow(node.head, isStraightHeader),
        config,
      ),
      ...listLookupDeclarator(filterNarrow(node.head, isLookupHeader), config),
      ...listPrivateDeclarator(
        filterNarrow(node.head, isPrivateHeader),
        config,
      ),
    ];
    return {
      type: "Program",
      sourceType: node.sort.kind === "module" ? "module" : "script",
      body: [
        ...(node.sort.mode === "strict" && node.sort.kind !== "module"
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
        ...listModuleDeclaration(
          filterNarrow(node.head, isModuleHeader),
          config,
        ),
        ...listEarlyDeclaration(
          filterNarrow(node.head, isEarlyStaticDeclareHeader),
          config,
        ),
        guard(
          some(node.head, isDynamicHeader),
          (completion) => ({
            type: "BlockStatement",
            body: [makeEvalDeclaration(node.sort.mode, config), completion],
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
                    ...(node.sort.mode === "sloppy"
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
                    ...rebuildClosureBlock(node.body, config, {
                      completion: "return",
                    }),
                  ],
                },
              },
              arguments: map(entries, getSecond),
            },
          }),
        ),
      ],
    };
  }
};
