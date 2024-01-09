import {
  isDeclarationHeader,
  isLookupHeader,
  isPrivateHeader,
  isStrictHeader,
  isSloppyHeader,
  isModuleHeader,
  isParameterHeader,
} from "../header.mjs";
import { compileGet, filterNarrow, includes, map } from "../util/index.mjs";
import { rebuildClosureBlock } from "./block.mjs";
import { makeDeclaration } from "./head-declare.mjs";
import { listLookupDeclarator } from "./head-lookup.mjs";
import { listStraightDeclarator } from "./head-straight.mjs";
import { listModuleDeclaration } from "./head-module.mjs";
import { listPrivateDeclarator } from "./head-private.mjs";

const getParameter = compileGet("parameter");

/**
 * @type {(
 *   parameters: import("../header").HeaderParameter[],
 *   head: (import("../header").StrictHeader)[],
 *   context: import("./context").Context,
 * ) => (estree.Statement | estree.Directive)[]}
 */
const rebuildStrictProgramHead = (parameters, head, context) => [
  {
    type: "ExpressionStatement",
    expression: {
      type: "Literal",
      value: "use strict",
    },
    directive: "use strict",
  },
  ...map(
    [
      ...listStraightDeclarator(parameters, context),
      ...(includes(parameters, "lookup.strict")
        ? listPrivateDeclarator(filterNarrow(head, isPrivateHeader), context)
        : []),
      ...(includes(parameters, "private")
        ? listLookupDeclarator(
            "strict",
            filterNarrow(head, isLookupHeader),
            context,
          )
        : []),
    ],
    (declarator) =>
      /** @type {estree.VariableDeclaration} */ ({
        type: "VariableDeclaration",
        kind: "let",
        declarations: [declarator],
      }),
  ),
  ...map(filterNarrow(head, isDeclarationHeader), makeDeclaration),
];

/**
 * @type {(
 *   node: aran.Program<rebuild.Atom>,
 *   context: import("./context").Context,
 *   options: {
 *     kind: "module" | "script",
 *   },
 * ) => estree.Program}
 */
export const rebuildProgram = (node, context, { kind }) => {
  const parameters = map(
    filterNarrow(node.head, isParameterHeader),
    getParameter,
  );
  const strict = filterNarrow(node.head, isStrictHeader);
  const sloppy = filterNarrow(node.head, isSloppyHeader);
  if (sloppy.length === 0) {
    return {
      type: "Program",
      sourceType: kind,
      body: [
        ...listModuleDeclaration(filterNarrow(strict, isModuleHeader), context),
        ...rebuildStrictProgramHead(parameters, strict, context),
        ...rebuildClosureBlock(node.body, context, { completion: "program" }),
      ],
    };
  } else {
    return {
      type: "Program",
      sourceType: kind,
      body: [
        ...map(filterNarrow(sloppy, isDeclarationHeader), makeDeclaration),
        ...(includes(parameters, "lookup.sloppy")
          ? map(
              listLookupDeclarator(
                "sloppy",
                filterNarrow(sloppy, isLookupHeader),
                context,
              ),
              (declarator) =>
                /** @type {estree.VariableDeclaration} */ ({
                  type: "VariableDeclaration",
                  kind: "let",
                  declarations: [declarator],
                }),
            )
          : []),
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
                  ...rebuildStrictProgramHead(parameters, strict, context),
                  ...rebuildClosureBlock(node.body, context, {
                    completion: "closure",
                  }),
                ],
              },
            },
            arguments: [],
          },
        },
      ],
    };
  }
};
