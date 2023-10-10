import {
  hoistBlock,
  hoistClosure,
  hoistExport,
  hoistImport,
} from "../query/index.mjs";
import { StaticError, flatMap, slice } from "../../util/index.mjs";
import { mangleMetaVariable } from "../mangle.mjs";
import { ANONYMOUS } from "../name.mjs";
import {
  makeEffectStatement,
  makeEvalProgram,
  makeModuleProgram,
  makePrimitiveExpression,
  makeReadExpression,
  makeScriptProgram,
  makeWriteEffect,
} from "../node.mjs";
import {
  makeScopeClosureBlock,
  makeScopePseudoBlock,
} from "../scope/index.mjs";
import { unbuildExpression } from "./expression.mjs";
import { unbuildModuleDeclaration } from "./link.mjs";
import { listBodyStatement } from "./statement.mjs";
import { drill, drillAll, drillArray } from "../../drill.mjs";
import { wrapOrigin } from "../origin.mjs";

const BASENAME = /** @type {__basename} */ ("program");

/** @type {(node: estree.Node) => node is estree.ModuleDeclaration} */
const isModuleDeclaration = (node) =>
  node.type === "ImportDeclaration" ||
  node.type === "ExportNamedDeclaration" ||
  node.type === "ExportDefaultDeclaration" ||
  node.type === "ExportAllDeclaration";

/**
 * @type {(
 *   pairs: {
 *     node:
 *       | estree.Directive
 *       | estree.Statement
 *       | estree.ModuleDeclaration,
 *     path: unbuild.Path,
 *   }[],
 * ) => {
 *   body: {
 *      node:
 *        | estree.Directive
 *        | estree.Statement
 *        | estree.ModuleDeclaration,
 *      path: unbuild.Path,
 *    }[],
 *   tail: null | {
 *     node: estree.Expression,
 *     path: unbuild.Path,
 *   }
 * }}
 */
const extractCompletion = (pairs) => {
  if (pairs.length === 0) {
    return {
      body: [],
      tail: null,
    };
  } else {
    const { node, path } = pairs[pairs.length - 1];
    if (node.type === "ExpressionStatement") {
      return {
        body: slice(pairs, 0, pairs.length - 1),
        tail: drill({ node, path }, "expression"),
      };
    } else {
      return { body: pairs, tail: null };
    }
  }
};

/** @type {(nodes: estree.Node[]) => boolean} */
const hasUseStrictDirective = (nodes) => {
  for (const node of nodes) {
    if (
      node.type !== "ExpressionStatement" ||
      node.expression.type !== "Literal" ||
      typeof node.expression.value !== "string"
    ) {
      return false;
    }
    if (node.expression.value === "use strict") {
      return true;
    }
  }
  return false;
};

/**
 * @type {(
 *   pair: {
 *     node: estree.Program,
 *     path: unbuild.Path,
 *   },
 *   context: import("../context.js").Context,
 *   options: {
 *     kind: "module" | "script",
 *     site: "global",
 *     enclave: boolean,
 *   } | {
 *     kind: "eval",
 *     site: "global" | "local",
 *     enclave: boolean,
 *   },
 * ) => aran.Program<unbuild.Atom>}
 */
export const unbuildProgram = wrapOrigin(
  ({ node, path }, old_context, { kind, site, enclave }) => {
    const context = {
      ...old_context,
      strict:
        old_context.strict ||
        node.sourceType === "module" ||
        hasUseStrictDirective(node.body),
      record: {
        ...old_context.record,
        "this":
          node.sourceType === "module"
            ? /** @type {".undefined"} */ (".undefined")
            : /** @type {".global"} */ (".global"),
        "import.meta":
          node.sourceType === "module"
            ? /** @type {aran.Parameter} */ ("import.meta")
            : /** @type {".illegal"} */ (".illegal"),
      },
    };
    const completion = mangleMetaVariable(
      BASENAME,
      /** @type {__unique} */ ("completion"),
      path,
    );
    switch (kind) {
      case "module":
        return makeModuleProgram(
          flatMap(
            drillAll(drillArray({ node, path }, "body")),
            ({ node, path }) =>
              isModuleDeclaration(node)
                ? unbuildModuleDeclaration({ node, path }, context, null)
                : [],
          ),
          makeScopeClosureBlock(
            context,
            {
              type: "module",
              site,
              enclave,
              kinds: {
                ...hoistBlock(node.body),
                ...hoistClosure(node.body),
              },
              import: hoistImport(node.body),
              export: hoistExport(node.body),
            },
            (context) =>
              listBodyStatement(
                drillAll(drillArray({ node, path }, "body")),
                context,
                {
                  labels: [],
                  completion: null,
                  loop: {
                    break: null,
                    continue: null,
                  },
                },
              ),
            (_context) => makePrimitiveExpression({ undefined: null }),
          ),
        );
      case "eval": {
        const { body, tail } = extractCompletion(
          drillAll(drillArray({ node, path }, "body")),
        );
        const frame = {
          type: /** @type {"eval"} */ ("eval"),
          site,
          enclave,
          kinds: {
            ...hoistBlock(node.body),
            ...hoistClosure(node.body),
          },
        };
        if (tail === null) {
          return makeEvalProgram(
            makeScopeClosureBlock(
              context,
              frame,
              (context) => [
                makeEffectStatement(
                  makeWriteEffect(
                    completion,
                    makePrimitiveExpression({ undefined: null }),
                    true,
                  ),
                ),
                ...listBodyStatement(body, context, {
                  labels: [],
                  completion: {
                    variable: completion,
                    root: node,
                  },
                  loop: {
                    break: null,
                    continue: null,
                  },
                }),
              ],
              (_context) => makeReadExpression(completion),
            ),
          );
        } else {
          return makeEvalProgram(
            makeScopeClosureBlock(
              context,
              frame,
              (context) =>
                listBodyStatement(body, context, {
                  labels: [],
                  completion: null,
                  loop: {
                    break: null,
                    continue: null,
                  },
                }),
              (context) =>
                unbuildExpression(tail, context, { name: ANONYMOUS }),
            ),
          );
        }
      }
      case "script": {
        const { body, tail } = extractCompletion(
          drillAll(drillArray({ node, path }, "body")),
        );
        const frame = {
          type: /** @type {"script"} */ ("script"),
          site,
          enclave,
          kinds: {
            ...hoistBlock(node.body),
            ...hoistClosure(node.body),
          },
        };
        if (tail === null) {
          return makeScriptProgram(
            makeScopePseudoBlock(
              { ...context, completion },
              frame,
              (context) => [
                makeEffectStatement(
                  makeWriteEffect(
                    completion,
                    makePrimitiveExpression({ undefined: null }),
                    true,
                  ),
                ),
                ...listBodyStatement(body, context, {
                  labels: [],
                  completion: {
                    variable: completion,
                    root: node,
                  },
                  loop: {
                    break: null,
                    continue: null,
                  },
                }),
              ],
              (_context) => makeReadExpression(completion),
            ),
          );
        } else {
          return makeScriptProgram(
            makeScopePseudoBlock(
              context,
              frame,
              (context) =>
                listBodyStatement(body, context, {
                  labels: [],
                  completion: null,
                  loop: {
                    break: null,
                    continue: null,
                  },
                }),
              (context) =>
                unbuildExpression(tail, context, { name: ANONYMOUS }),
            ),
          );
        }
      }
      default:
        throw new StaticError("invalid program kind", kind);
    }
  },
);
