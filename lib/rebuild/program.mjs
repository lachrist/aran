import {
  isPrivateHeader,
  isModuleHeader,
  isStraightHeader,
  isLookupHeader,
  isDynamicHeader,
  isDeclareHeader,
} from "../header.mjs";
import { filterNarrow, map, some } from "../util/index.mjs";
import { rebuildClosureBlock } from "./block.mjs";
import { listLookupDeclarator } from "./head-lookup.mjs";
import { listStraightDeclarator } from "./head-straight.mjs";
import { listModuleDeclaration } from "./head-module.mjs";
import { listPrivateDeclarator } from "./head-private.mjs";
import { makeIntrinsicDeclarator } from "./intrinsic.mjs";
import { listEvalDeclarator } from "./head-eval.mjs";
import { isInternalLocalEvalSort } from "../sort.mjs";
import { AranTypeError } from "../error.mjs";
import { listDeclaration } from "./head-declare.mjs";

/**
 * @type {(
 *   entry: [
 *     estree.Identifier,
 *     estree.Expression,
 *   ],
 * ) => estree.VariableDeclarator}
 */
const makeEntryDeclarator = ([identifier, expression]) => ({
  type: "VariableDeclarator",
  id: identifier,
  init: expression,
});

/**
 * @type {(
 *   kind: "const" | "let",
 *   entries: [
 *     estree.Identifier,
 *     estree.Expression,
 *   ][],
 * ) => estree.Statement[]}
 */
const declare = (kind, entries) => {
  if (entries.length === 0) {
    return [];
  } else {
    return [
      {
        type: "VariableDeclaration",
        kind,
        declarations: map(entries, makeEntryDeclarator),
      },
    ];
  }
};

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
        ...rebuildClosureBlock(node.body, config, {
          completion: "expression",
        }),
      ],
    };
  } else {
    // Case analysis on mode to avoid introducing a closure in strict mode.
    // Important because module (strict mode) can have top-level await.
    switch (node.sort.mode) {
      case "sloppy": {
        return {
          type: "Program",
          sourceType: "script",
          body: [
            ...listDeclaration(
              filterNarrow(node.head, isDeclareHeader),
              config,
            ),
            {
              type: "BlockStatement",
              body: [
                ...declare("const", [
                  makeIntrinsicDeclarator(config),
                  ...(some(node.head, isDynamicHeader)
                    ? listEvalDeclarator(node.sort.mode, config)
                    : []),
                ]),
                ...declare("let", [
                  ...listStraightDeclarator(
                    filterNarrow(node.head, isStraightHeader),
                    config,
                  ),
                  ...listLookupDeclarator(
                    filterNarrow(node.head, isLookupHeader),
                    config,
                  ),
                  ...listPrivateDeclarator(
                    node.sort.mode,
                    filterNarrow(node.head, isPrivateHeader),
                    config,
                  ),
                ]),
                /** @type {estree.Statement} */ ({
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
                            expression: {
                              type: "Literal",
                              value: "use strict",
                            },
                            directive: "use strict",
                          }),
                          ...rebuildClosureBlock(node.body, config, {
                            completion: "return",
                          }),
                        ],
                      },
                    },
                    arguments: [],
                  },
                }),
              ],
            },
          ],
        };
      }
      case "strict": {
        return {
          type: "Program",
          sourceType: node.sort.kind === "module" ? "module" : "script",
          body: [
            ...(node.sort.kind === "module"
              ? []
              : [
                  /** @type {estree.Directive} */ ({
                    type: "ExpressionStatement",
                    expression: {
                      type: "Literal",
                      value: "use strict",
                    },
                    directive: "use strict",
                  }),
                ]),
            ...listModuleDeclaration(
              filterNarrow(node.head, isModuleHeader),
              config,
            ),
            ...listDeclaration(
              filterNarrow(node.head, isDeclareHeader),
              config,
            ),
            {
              type: "BlockStatement",
              body: [
                ...declare("const", [
                  makeIntrinsicDeclarator(config),
                  ...(some(node.head, isDynamicHeader)
                    ? listEvalDeclarator(node.sort.mode, config)
                    : []),
                ]),
                ...declare("let", [
                  ...listStraightDeclarator(
                    filterNarrow(node.head, isStraightHeader),
                    config,
                  ),
                  ...listLookupDeclarator(
                    filterNarrow(node.head, isLookupHeader),
                    config,
                  ),
                  ...listPrivateDeclarator(
                    node.sort.mode,
                    filterNarrow(node.head, isPrivateHeader),
                    config,
                  ),
                ]),
                ...rebuildClosureBlock(node.body, config, {
                  completion: "expression",
                }),
              ],
            },
          ],
        };
      }
      default: {
        throw new AranTypeError(node.sort);
      }
    }
  }
};
