import {
  hoistBlock,
  hoistClosure,
  hoistExport,
  hoistImport,
} from "../query/index.mjs";
import { AranTypeError, flatMap, slice } from "../../util/index.mjs";
import { makeFragment, mangleMetaVariable } from "../mangle.mjs";
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

const LOCATION = /** @type {__location} */ ("lib/unbuild/visitors/program.mjs");

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
export const unbuildProgram = (
  { node, path },
  context,
  { kind, site, enclave },
) => {
  const completion = mangleMetaVariable(
    path,
    makeFragment(LOCATION, /** @type {__unique} */ ("completion")),
  );
  switch (kind) {
    case "module": {
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
            type: "program",
            kind: "module",
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
                parent: "program",
                labels: [],
                completion: null,
                loop: {
                  break: null,
                  continue: null,
                },
              },
            ),
          (_context) => makePrimitiveExpression({ undefined: null }, path),
          path,
        ),
        path,
      );
    }
    case "eval": {
      const { body, tail } = extractCompletion(
        drillAll(drillArray({ node, path }, "body")),
      );
      /** @type {import("../scope/index.mjs").Frame} */
      const frame = {
        type: "program",
        kind: "eval",
        site,
        enclave,
        import: {},
        export: {},
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
                  makePrimitiveExpression({ undefined: null }, path),
                  true,
                  path,
                ),
                path,
              ),
              ...listBodyStatement(body, context, {
                parent: "program",
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
            (_context) => makeReadExpression(completion, path),
            path,
          ),
          path,
        );
      } else {
        return makeEvalProgram(
          makeScopeClosureBlock(
            context,
            frame,
            (context) =>
              listBodyStatement(body, context, {
                parent: "program",
                labels: [],
                completion: null,
                loop: {
                  break: null,
                  continue: null,
                },
              }),
            (context) => unbuildExpression(tail, context, { name: ANONYMOUS }),
            path,
          ),
          path,
        );
      }
    }
    case "script": {
      const { body, tail } = extractCompletion(
        drillAll(drillArray({ node, path }, "body")),
      );
      /** @type {import("../scope/index.mjs").Frame} */
      const frame = {
        type: "program",
        kind: "script",
        site: "global",
        enclave,
        import: {},
        export: {},
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
                  makePrimitiveExpression({ undefined: null }, path),
                  true,
                  path,
                ),
                path,
              ),
              ...listBodyStatement(body, context, {
                parent: "program",
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
            (_context) => makeReadExpression(completion, path),
            path,
          ),
          path,
        );
      } else {
        return makeScriptProgram(
          makeScopePseudoBlock(
            context,
            frame,
            (context) =>
              listBodyStatement(body, context, {
                parent: "program",
                labels: [],
                completion: null,
                loop: {
                  break: null,
                  continue: null,
                },
              }),
            (context) => unbuildExpression(tail, context, { name: ANONYMOUS }),
            path,
          ),
          path,
        );
      }
    }
    default: {
      throw new AranTypeError("invalid program kind", kind);
    }
  }
};
