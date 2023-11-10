import {
  hoistBlock,
  hoistClosure,
  hoistExport,
  hoistImport,
} from "../query/index.mjs";
import { AranTypeError, flatMap, map, slice } from "../../util/index.mjs";
import { splitMeta } from "../mangle.mjs";
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
import { drill, drillArray } from "../site.mjs";
import { makeInitCacheUnsafe, makeReadCacheExpression } from "../cache.mjs";
import { isModuleDeclarationSite } from "../predicate.mjs";

/**
 * @type {(
 *   sites: import("../site.mjs").Site<(
 *     | estree.Directive
 *     | estree.Statement
 *     | estree.ModuleDeclaration
 *   )>[],
 * ) => {
 *   body: import("../site.mjs").Site<(
 *     | estree.Directive
 *     | estree.Statement
 *     | estree.ModuleDeclaration
 *   )>[],
 *   tail: null | import("../site.mjs").Site<estree.Expression>,
 * }}
 */
const extractCompletion = (sites) => {
  if (sites.length === 0) {
    return {
      body: [],
      tail: null,
    };
  } else {
    const { node, path, meta } = sites[sites.length - 1];
    if (node.type === "ExpressionStatement") {
      return {
        body: slice(sites, 0, sites.length - 1),
        tail: drill({ node, path, meta }, ["expression"]).expression,
      };
    } else {
      return { body: sites, tail: null };
    }
  }
};

/**
 * @type {(
 *   site: import("../site.mjs").Site<estree.Program>,
 *   context: import("../context.js").Context,
 *   options: {
 *     kind: "module" | "script",
 *     situ: "global",
 *     enclave: boolean,
 *   } | {
 *     kind: "eval",
 *     situ: "global" | "local",
 *     enclave: boolean,
 *   },
 * ) => aran.Program<unbuild.Atom>}
 */
export const unbuildProgram = (
  { node, path, meta },
  context,
  { kind, situ, enclave },
) => {
  switch (kind) {
    case "module": {
      const metas = splitMeta(meta, ["drill1", "drill2"]);
      const sites1 = drill({ node, path, meta: metas.drill1 }, ["body"]);
      const sites2 = drill({ node, path, meta: metas.drill2 }, ["body"]);
      return makeModuleProgram(
        flatMap(drillArray(sites1.body), (site) =>
          isModuleDeclarationSite(site)
            ? unbuildModuleDeclaration(site, context, {})
            : [],
        ),
        makeScopeClosureBlock(
          context,
          {
            type: "program",
            kind: "module",
            situ,
            enclave,
            kinds: {
              ...hoistBlock(node.body),
              ...hoistClosure(node.body),
            },
            import: hoistImport(node.body),
            export: hoistExport(node.body),
          },
          (context) =>
            listBodyStatement(drillArray(sites2.body), context, {
              parent: "program",
              labels: [],
              completion: null,
              loop: {
                break: null,
                continue: null,
              },
            }),
          (_context) => makePrimitiveExpression({ undefined: null }, path),
          path,
        ),
        path,
      );
    }
    case "eval": {
      const metas = splitMeta(meta, ["drill", "completion"]);
      const sites = drill({ node, path, meta: metas.drill }, ["body"]);
      const { body, tail } = extractCompletion(drillArray(sites.body));
      /** @type {import("../scope/index.mjs").Frame} */
      const frame = {
        type: "program",
        kind: "eval",
        situ,
        enclave,
        import: {},
        export: {},
        kinds: {
          ...hoistBlock(node.body),
          ...hoistClosure(node.body),
        },
      };
      if (tail === null) {
        return makeInitCacheUnsafe(
          "writable",
          makePrimitiveExpression({ undefined: null }, path),
          { path, meta: metas.completion },
          (setup, completion) =>
            makeEvalProgram(
              makeScopeClosureBlock(
                context,
                frame,
                (context) => [
                  ...map(setup, (node) => makeEffectStatement(node, path)),
                  ...listBodyStatement(body, context, {
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
            (context) => unbuildExpression(tail, context, {}),
            path,
          ),
          path,
        );
      }
    }
    case "script": {
      const metas = splitMeta(meta, ["drill", "completion"]);
      const sites = drill({ node, path, meta: metas.drill }, ["body"]);
      const { body, tail } = extractCompletion(drillArray(sites.body));
      /** @type {import("../scope/index.mjs").Frame} */
      const frame = {
        type: "program",
        kind: "script",
        situ: "global",
        enclave,
        import: {},
        export: {},
        kinds: {
          ...hoistBlock(node.body),
          ...hoistClosure(node.body),
        },
      };
      if (tail === null) {
        return makeInitCacheUnsafe(
          "writable",
          makePrimitiveExpression({ undefined: null }, path),
          { path, meta: metas.completion },
          (setup, completion) =>
            makeScriptProgram(
              makeScopePseudoBlock(
                context,
                frame,
                (context) => [
                  ...map(setup, (node) => makeEffectStatement(node, path)),
                  ...listBodyStatement(body, context, {
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
            (context) => unbuildExpression(tail, context, {}),
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
