import {
  hoistBlock,
  hoistClosure,
  hoistExport,
  hoistImport,
  listModuleHeader,
} from "../query/index.mjs";
import { flatMap, join, map, reduce, slice } from "../../util/index.mjs";
import { AranTypeError } from "../../error.mjs";
import { splitMeta } from "../mangle.mjs";
import {
  makeEffectStatement,
  makeProgram,
  makePrimitiveExpression,
  tellLog,
  listHeader,
} from "../node.mjs";
import { extendStaticScope } from "../scope/index.mjs";
import { unbuildExpression } from "./expression.mjs";
import { listBodyStatement } from "./statement.mjs";
import { drill, drillArray } from "../site.mjs";
import { cacheWritable, makeReadCacheExpression } from "../cache.mjs";
import {
  bindSequence,
  initSequence,
  passSequence,
  sequenceClosureBlock,
  zeroSequence,
} from "../sequence.mjs";
import { listSetupClosureEffect } from "../param/index.mjs";

const {
  Object: { keys: listKey },
} = globalThis;

/**
 * @type {(
 *   sites: import("../site.d.ts").Site<(
 *     | estree.Directive
 *     | estree.Statement
 *     | estree.ModuleDeclaration
 *   )>[],
 * ) => {
 *   body: import("../site.d.ts").Site<(
 *     | estree.Directive
 *     | estree.Statement
 *     | estree.ModuleDeclaration
 *   )>[],
 *   tail: null | import("../site.d.ts").Site<estree.Expression>,
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
 *   situ: import("../../situ.js").Situ,
 *   node: estree.Program,
 * ) => {
 *   external: {[k in estree.Variable]: estree.VariableKind},
 *   internal: {[k in estree.Variable]: estree.VariableKind},
 *   logs: Omit<unbuild.Log, "path">[],
 * }}
 */
const hoistProgram = (situ, node) => {
  switch (situ.kind) {
    case "eval": {
      switch (situ.mode) {
        case "strict": {
          return {
            external: {},
            internal: {
              ...hoistClosure(situ.mode, node.body),
              ...hoistBlock(situ.mode, node.body),
            },
            logs: [],
          };
        }
        case "sloppy": {
          switch (situ.scope) {
            case "local": {
              const kinds = hoistClosure(situ.mode, node.body);
              const variables = listKey(kinds);
              return {
                external: {},
                internal: {
                  ...kinds,
                  ...hoistBlock(situ.mode, node.body),
                },
                logs:
                  variables.length > 0
                    ? [
                        {
                          name: "DirectEvalExternalVariableDeclaration",
                          message: `Internalizing declaration of ${join(
                            variables,
                            ",",
                          )}`,
                        },
                      ]
                    : [],
              };
            }
            case "global": {
              return {
                external: hoistClosure(situ.mode, node.body),
                internal: hoistBlock(situ.mode, node.body),
                logs: [],
              };
            }
            default: {
              throw new AranTypeError("invalid situ", situ);
            }
          }
        }
        default: {
          throw new AranTypeError("invalid situ", situ);
        }
      }
    }
    case "script": {
      return {
        external: {
          ...hoistBlock(situ.mode, node.body),
          ...hoistClosure(situ.mode, node.body),
        },
        internal: {},
        logs: [],
      };
    }
    case "module": {
      return {
        external: {},
        internal: {
          ...hoistBlock(situ.mode, node.body),
          ...hoistClosure(situ.mode, node.body),
        },
        logs: [],
      };
    }
    default: {
      throw new AranTypeError("invalid program", situ);
    }
  }
};

/**
 * @type {(
 *   site: import("../site.d.ts").Site<estree.Program>,
 *   scope: import("../scope").Scope,
 *   options: {
 *     situ: import("../../situ.js").NodeSitu | null,
 *   },
 * ) => aran.Program<unbuild.Atom>}
 */
export const unbuildProgram = (
  { node, path, meta },
  scope,
  { situ: node_situ },
) => {
  const metas = splitMeta(meta, ["drill", "completion", "setup"]);
  const situ = node_situ ?? scope.situ;
  const { logs, external, internal } = hoistProgram(situ, node);
  const { body, tail } = extractCompletion(
    drillArray(drill({ node, path, meta: metas.drill }, ["body"]).body),
  );
  const block = sequenceClosureBlock(
    bindSequence(
      extendStaticScope({ path }, scope, {
        frame: { situ: "global", link: null, kinds: external },
      }),
      (scope) =>
        bindSequence(
          extendStaticScope({ path }, scope, {
            frame: {
              situ: "local",
              kinds: internal,
              link:
                situ.kind === "module"
                  ? {
                      import: hoistImport(node.body),
                      export: hoistExport(node.body),
                    }
                  : null,
            },
          }),
          (scope) =>
            bindSequence(
              situ.kind === "module" || tail !== null
                ? passSequence(
                    cacheWritable(
                      metas.completion,
                      makePrimitiveExpression({ undefined: null }, path),
                      path,
                    ),
                    (node) => makeEffectStatement(node, path),
                  )
                : zeroSequence(null),
              (completion) =>
                initSequence(
                  [
                    ...map(
                      listSetupClosureEffect(
                        { path, meta: metas.setup },
                        scope,
                      ),
                      (node) => makeEffectStatement(node, path),
                    ),
                    ...listBodyStatement(body, scope, {
                      parent: "program",
                      labels: [],
                      completion:
                        completion === null
                          ? null
                          : {
                              cache: completion,
                              root: node,
                            },
                      loop: {
                        break: null,
                        continue: null,
                      },
                    }),
                  ],
                  completion === null
                    ? tail === null
                      ? makePrimitiveExpression({ undefined: null }, path)
                      : unbuildExpression(tail, scope, {})
                    : makeReadCacheExpression(completion, path),
                ),
            ),
        ),
    ),
    path,
  );
  return reduce(
    logs,
    tellLog,
    makeProgram(
      [...flatMap(node.body, listModuleHeader), ...listHeader(block)],
      block,
      path,
    ),
  );
};
