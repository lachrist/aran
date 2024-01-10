import {
  isDeclareHeader,
  isPrivateHeader,
  isModuleHeader,
  isParameterHeader,
  isSloppyLookupHeader,
  isStrictLookupHeader,
  isSloppyHeader,
} from "../header.mjs";
import {
  compileGet,
  filterNarrow,
  includes,
  map,
  some,
} from "../util/index.mjs";
import { rebuildClosureBlock } from "./block.mjs";
import { makeDeclaration } from "./head-declare.mjs";
import { listLookupDeclarator } from "./head-lookup.mjs";
import { listStraightDeclarator } from "./head-straight.mjs";
import { listModuleDeclaration } from "./head-module.mjs";
import { listPrivateDeclarator } from "./head-private.mjs";
import { INTRINSIC, mangleParameter } from "./mangle.mjs";

const getParameter = compileGet("parameter");

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
 *   config: {
 *     intrinsic: estree.Variable,
 *     escape: estree.Variable,
 *   },
 * ) => estree.Program}
 */
export const rebuildProgram = (node, config) => {
  const mode = some(node.head, isSloppyHeader) ? "sloppy" : "strict";
  const parameters = map(
    filterNarrow(node.head, isParameterHeader),
    getParameter,
  );
  const entries = [
    ...listStraightDeclarator(parameters, config),
    ...(includes(parameters, "lookup.strict")
      ? listLookupDeclarator(
          "strict",
          filterNarrow(node.head, isStrictLookupHeader),
          config,
        )
      : []),
    ...(includes(parameters, "lookup.sloppy")
      ? listLookupDeclarator(
          "sloppy",
          filterNarrow(node.head, isSloppyLookupHeader),
          config,
        )
      : []),
    ...(includes(parameters, "private")
      ? listPrivateDeclarator(filterNarrow(node.head, isPrivateHeader), config)
      : []),
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
                ...rebuildClosureBlock(node.body, config, {
                  completion: "closure",
                }),
              ],
            },
          },
          arguments: [
            {
              type: "Identifier",
              name: config.intrinsic,
            },
            ...map(entries, getSecond),
          ],
        },
      },
    ],
  };
};
