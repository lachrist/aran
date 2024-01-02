import {
  hoistBlock,
  hoistClosure,
  hoistExport,
  hoistImport,
  listModuleHeader,
} from "../query/index.mjs";
import { flatMap, mapIndex, reduce, slice } from "../../util/index.mjs";
import { AranTypeError } from "../../error.mjs";
import { makeProgram, makePrimitiveExpression, listHeader } from "../node.mjs";
import { unbuildExpression } from "./expression.mjs";
import { listBodyStatement } from "./statement.mjs";
import { cacheWritable, makeReadCacheExpression } from "../cache.mjs";
import {
  bindSequence,
  flatSequence,
  mapSequence,
  passSequence,
  sequenceClosureBlock,
  zeroSequence,
} from "../sequence.mjs";
import { drillDeepSite, drillSite } from "../site.mjs";
import { forkMeta, nextMeta } from "../meta.mjs";
import {
  extendScope,
  setupGlobalObjectFrame,
  setupGlobalRecordFrame,
  setupExternalStaticFrame,
  setupImportFrame,
  setupRegularStaticFrame,
  getMode,
} from "../scope/index.mjs";
import { makeEffectPrelude } from "../prelude.mjs";

/**
 * @type {(
 *   sites: import("../site").Site<(
 *     | estree.Directive
 *     | estree.Statement
 *     | estree.ModuleDeclaration
 *   )>[],
 * ) => {
 *   body: import("../site").Site<(
 *     | estree.Directive
 *     | estree.Statement
 *     | estree.ModuleDeclaration
 *   )>[],
 *   tail: null | import("../site").Site<estree.Expression>,
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
        tail: drillSite(node, path, meta, "expression"),
      };
    } else {
      return { body: sites, tail: null };
    }
  }
};

/**
 * @type {(
 *   site: import("../site").Site<estree.Program>,
 *   options: {
 *     mode: "strict" | "sloppy",
 *     situ: import("../../situ").Situ,
 *   },
 * ) => import("../sequence").PreludeSequence<
 *   import("../scope").NodeFrame,
 * >[]}
 */
const setupAllFrame = ({ node, path, meta }, { mode, situ }) => {
  if (situ.kind === "module") {
    if (situ.scope === "global") {
      const import_sequence = setupImportFrame(
        { path },
        { entries: flatMap(node.body, hoistImport) },
      );
      const regular_sequence = setupRegularStaticFrame(
        { path },
        {
          mode,
          entries: [
            ...flatMap(node.body, (node) => hoistClosure(mode, node)),
            ...flatMap(node.body, (node) => hoistBlock(mode, node)),
          ],
          exports: hoistExport(node.body),
        },
      );
      if (situ.ambient === "internal") {
        return [
          setupGlobalObjectFrame({ path }, { mode, entries: [] }),
          setupGlobalRecordFrame({ path }, { mode, entries: [] }),
          import_sequence,
          regular_sequence,
        ];
      } else if (situ.ambient === "external") {
        return [
          setupExternalStaticFrame({ path, meta }, { mode, entries: [] }),
          import_sequence,
          regular_sequence,
        ];
      } else {
        throw new AranTypeError(situ.ambient);
      }
    } else {
      throw new AranTypeError(situ);
    }
  } else if (situ.kind === "script") {
    if (situ.scope === "global") {
      if (situ.ambient === "internal") {
        return [
          setupGlobalObjectFrame(
            { path },
            {
              mode,
              entries: flatMap(node.body, (node) => hoistClosure(mode, node)),
            },
          ),
          setupGlobalRecordFrame(
            { path },
            {
              mode,
              entries: flatMap(node.body, (node) => hoistBlock(mode, node)),
            },
          ),
        ];
      } else {
        return [
          setupExternalStaticFrame(
            { path, meta },
            {
              mode,
              entries: [
                ...flatMap(node.body, (node) => hoistClosure(mode, node)),
                ...flatMap(node.body, (node) => hoistBlock(mode, node)),
              ],
            },
          ),
        ];
      }
    } else {
      throw new AranTypeError(situ);
    }
  } else if (situ.kind === "eval") {
    if (situ.scope === "global") {
      if (mode === "strict") {
        const regular_sequence = setupRegularStaticFrame(
          { path },
          {
            mode,
            entries: [
              ...flatMap(node.body, (node) => hoistClosure(mode, node)),
              ...flatMap(node.body, (node) => hoistBlock(mode, node)),
            ],
            exports: hoistExport(node.body),
          },
        );
        if (situ.ambient === "internal") {
          return [
            setupGlobalObjectFrame({ path }, { mode, entries: [] }),
            setupGlobalRecordFrame({ path }, { mode, entries: [] }),
            regular_sequence,
          ];
        } else if (situ.ambient === "external") {
          return [
            setupExternalStaticFrame({ path, meta }, { mode, entries: [] }),
            regular_sequence,
          ];
        } else {
          throw new AranTypeError(situ.ambient);
        }
      } else if (mode === "sloppy") {
        const regular_sequence = setupRegularStaticFrame(
          { path },
          {
            mode,
            entries: flatMap(node.body, (node) => hoistBlock(mode, node)),
            exports: hoistExport(node.body),
          },
        );
        if (situ.ambient === "internal") {
          return [
            setupGlobalObjectFrame(
              { path },
              {
                mode,
                entries: flatMap(node.body, (node) => hoistClosure(mode, node)),
              },
            ),
            setupGlobalRecordFrame({ path }, { mode, entries: [] }),
            regular_sequence,
          ];
        } else if (situ.ambient === "external") {
          return [
            setupExternalStaticFrame(
              { path, meta },
              {
                mode,
                entries: flatMap(node.body, (node) => hoistClosure(mode, node)),
              },
            ),
            regular_sequence,
          ];
        } else {
          throw new AranTypeError(situ.ambient);
        }
      } else {
        throw new AranTypeError(mode);
      }
    } else if (situ.scope === "local") {
      if (mode === "strict") {
        return [
          setupRegularStaticFrame(
            { path },
            {
              mode,
              entries: [
                ...flatMap(node.body, (node) => hoistClosure(mode, node)),
                ...flatMap(node.body, (node) => hoistBlock(mode, node)),
              ],
              exports: {},
            },
          ),
        ];
      } else if (mode === "sloppy") {
        const regular_sequence = setupRegularStaticFrame(
          { path },
          {
            mode,
            entries: flatMap(node.body, (node) => hoistBlock(mode, node)),
            exports: hoistExport(node.body),
          },
        );
        if (situ.ambient === "internal") {
          return TODO;
        } else if (situ.ambient === "external") {
          return [
            setupExternalStaticFrame(
              { path, meta },
              {
                mode,
                entries: flatMap(node.body, (node) => hoistClosure(mode, node)),
              },
            ),
            regular_sequence,
          ];
        } else {
          throw new AranTypeError(situ);
        }
      } else {
        throw new AranTypeError(mode);
      }
    } else {
      throw new AranTypeError(situ);
    }
  } else {
    throw new AranTypeError(situ);
  }
};

/**
 * @type {(
 *   site: import("../site.d.ts").Site<estree.Program>,
 *   scope: import("../scope").Scope,
 *   options: {
 *     situ: import("../../situ").Situ,
 *   },
 * ) => aran.Program<unbuild.Atom>}
 */
export const unbuildProgram = ({ node, path, meta }, scope, { situ }) => {
  const mode = getMode(scope);
  const { body, tail } = extractCompletion(
    mapIndex(node.body.length, (index) =>
      drillDeepSite(
        node,
        path,
        forkMeta((meta = nextMeta(meta))),
        "body",
        index,
      ),
    ),
  );
  const block = sequenceClosureBlock(
    bindSequence(
      mapSequence(
        flatSequence(
          setupAllFrame(
            { node, path, meta: forkMeta((meta = nextMeta(meta))) },
            { mode, situ },
          ),
        ),
        (frames) => reduce(frames, extendScope, scope),
      ),
      (scope) =>
        mapSequence(
          situ.kind === "module" || tail !== null
            ? passSequence(
                cacheWritable(
                  forkMeta((meta = nextMeta(meta))),
                  makePrimitiveExpression({ undefined: null }, path),
                  path,
                ),
                makeEffectPrelude,
              )
            : zeroSequence(null),
          (completion) => ({
            body: listBodyStatement(body, scope, {
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
            completion:
              completion === null
                ? tail === null
                  ? makePrimitiveExpression({ undefined: null }, path)
                  : unbuildExpression(tail, scope, null)
                : makeReadCacheExpression(completion, path),
          }),
        ),
    ),
    path,
  );
  return makeProgram(
    [...flatMap(node.body, listModuleHeader), ...listHeader(block)],
    block,
    path,
  );
};
