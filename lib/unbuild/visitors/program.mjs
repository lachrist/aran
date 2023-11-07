import {
  hoistBlock,
  hoistClosure,
  hoistExport,
  hoistImport,
} from "../query/index.mjs";
import { AranTypeError, flatMap, map, slice } from "../../util/index.mjs";
import { splitMeta } from "../mangle.mjs";
import { ANONYMOUS } from "../name.mjs";
import {
  makeEffectStatement,
  makeEvalProgram,
  makeModuleProgram,
  makePrimitiveExpression,
  makeScriptProgram,
} from "../node.mjs";
import {
  makeScopeClosureBlock,
  makeScopePseudoBlock,
} from "../scope/index.mjs";
import { unbuildExpression } from "./expression.mjs";
import { unbuildModuleDeclaration } from "./link.mjs";
import { listBodyStatement } from "./statement.mjs";
import { drill, drillAll, drillArray } from "../../drill.mjs";
import { makeInitCacheUnsafe, makeReadCacheExpression } from "../cache.mjs";

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
 *     meta: unbuild.Meta,
 *   } | {
 *     kind: "eval",
 *     site: "global" | "local",
 *     enclave: boolean,
 *     meta: unbuild.Meta,
 *   },
 * ) => aran.Program<unbuild.Atom>}
 */
export const unbuildProgram = (
  { node, path },
  context,
  { meta, kind, site, enclave },
) => {
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
                meta,
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
        const metas = splitMeta(meta, ["body", "completion_cache"]);
        return makeInitCacheUnsafe(
          "writable",
          makePrimitiveExpression({ undefined: null }, path),
          { path, meta: metas.completion_cache },
          (setup, completion) =>
            makeEvalProgram(
              makeScopeClosureBlock(
                context,
                frame,
                (context) => [
                  ...map(setup, (node) => makeEffectStatement(node, path)),
                  ...listBodyStatement(body, context, {
                    meta: metas.body,
                    parent: "program",
                    labels: [],
                    completion: {
                      cache: completion,
                      root: node,
                    },
                    loop: {
                      break: null,
                      continue: null,
                    },
                  }),
                ],
                (_context) => makeReadCacheExpression(completion, path),
                path,
              ),
              path,
            ),
        );
      } else {
        const metas = splitMeta(meta, ["body", "tail"]);
        return makeEvalProgram(
          makeScopeClosureBlock(
            context,
            frame,
            (context) =>
              listBodyStatement(body, context, {
                meta: metas.body,
                parent: "program",
                labels: [],
                completion: null,
                loop: {
                  break: null,
                  continue: null,
                },
              }),
            (context) =>
              unbuildExpression(tail, context, {
                meta: metas.tail,
                name: ANONYMOUS,
              }),
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
        const metas = splitMeta(meta, ["body", "completion_cache"]);
        return makeInitCacheUnsafe(
          "writable",
          makePrimitiveExpression({ undefined: null }, path),
          { path, meta: metas.completion_cache },
          (setup, completion) =>
            makeScriptProgram(
              makeScopePseudoBlock(
                context,
                frame,
                (context) => [
                  ...map(setup, (node) => makeEffectStatement(node, path)),
                  ...listBodyStatement(body, context, {
                    meta: metas.body,
                    parent: "program",
                    labels: [],
                    completion: {
                      cache: completion,
                      root: node,
                    },
                    loop: {
                      break: null,
                      continue: null,
                    },
                  }),
                ],
                (_context) => makeReadCacheExpression(completion, path),
                path,
              ),
              path,
            ),
        );
      } else {
        const metas = splitMeta(meta, ["body", "tail"]);
        return makeScriptProgram(
          makeScopePseudoBlock(
            context,
            frame,
            (context) =>
              listBodyStatement(body, context, {
                meta: metas.body,
                parent: "program",
                labels: [],
                completion: null,
                loop: {
                  break: null,
                  continue: null,
                },
              }),
            (context) =>
              unbuildExpression(tail, context, {
                meta: metas.tail,
                name: ANONYMOUS,
              }),
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
