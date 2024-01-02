import {
  hoistBlock,
  hoistClosure,
  hoistExport,
  hoistImport,
  listModuleHeader,
} from "../query/index.mjs";
import { flatMap, reduce, slice } from "../../util/index.mjs";
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
import { drillSite } from "../site.mjs";
import { forkMeta, nextMeta } from "../meta.mjs";
import {
  extendScope,
  setupGlobalObjectFrame,
  setupGlobalRecordFrame,
  setupExternalFrame,
  setupRegularFrame,
  getMode,
  updateScope,
} from "../scope/index.mjs";
import { makeEffectPrelude } from "../prelude.mjs";

/**
 * @type {(
 *   sites: import("../site").Site<(
 *     | estree.Directive
 *     | estree.Statement
 *     | estree.ModuleDeclaration
 *   )[]>,
 * ) => {
 *   body: import("../site").Site<(
 *     | estree.Directive
 *     | estree.Statement
 *     | estree.ModuleDeclaration
 *   )[]>,
 *   tail: null | import("../site").Site<estree.Expression>,
 * }}
 */
const extractCompletion = ({ node: nodes, path, meta }) => {
  if (nodes.length === 0) {
    return {
      body: { node: nodes, path, meta },
      tail: null,
    };
  } else {
    const meta0 = meta;
    const meta1 = nextMeta(meta0);
    const meta2 = nextMeta(meta1);
    const last = drillSite(nodes, path, forkMeta(meta1), nodes.length - 1);
    if (last.node.type === "ExpressionStatement") {
      return {
        body: {
          node: slice(nodes, 0, nodes.length - 1),
          path,
          meta: forkMeta(meta2),
        },
        tail: drillSite(last.node, last.path, last.meta, "expression"),
      };
    } else {
      return {
        body: { node: nodes, path, meta },
        tail: null,
      };
    }
  }
};

/**
 * @type {(
 *   scope: import("../scope").Scope,
 *   frames: import("../sequence").PreludeSequence<
 *     import("../scope").NodeFrame
 *   >[],
 * ) => import("../sequence").PreludeSequence<
 *   import("../scope").Scope
 * >}
 */
const reduceFrame = (scope, sequences) =>
  mapSequence(flatSequence(sequences), (frames) =>
    reduce(frames, extendScope, scope),
  );

/**
 * @type {(
 *   site: import("../site").Site<estree.Program>,
 *   scope: import("../scope").Scope,
 *   options: {
 *     mode: "strict" | "sloppy",
 *     situ: import("../../situ").Situ,
 *   },
 * ) => import("../sequence").PreludeSequence<
 *   import("../scope").Scope
 * >}
 */
const setupScope = ({ node, path, meta }, scope, { mode, situ }) => {
  if (situ.kind === "module") {
    if (situ.scope === "global") {
      const internal = setupRegularFrame(
        { path },
        [
          ...flatMap(node.body, (node) => hoistClosure(mode, node)),
          ...flatMap(node.body, (node) => hoistBlock(mode, node)),
        ],
        {
          import: hoistImport(node.body),
          export: hoistExport(node.body),
        },
      );
      if (situ.ambient === "internal") {
        return reduceFrame(scope, [
          setupGlobalObjectFrame({ path }, []),
          setupGlobalRecordFrame({ path }, []),
          internal,
        ]);
      } else if (situ.ambient === "external") {
        return reduceFrame(scope, [
          setupExternalFrame({ path, meta }, [], { mode }),
          internal,
        ]);
      } else {
        throw new AranTypeError(situ.ambient);
      }
    } else {
      throw new AranTypeError(situ);
    }
  } else if (situ.kind === "script") {
    if (situ.scope === "global") {
      if (situ.ambient === "internal") {
        return reduceFrame(scope, [
          setupGlobalObjectFrame(
            { path },
            flatMap(node.body, (node) => hoistClosure(mode, node)),
          ),
          setupGlobalRecordFrame(
            { path },
            flatMap(node.body, (node) => hoistBlock(mode, node)),
          ),
        ]);
      } else {
        return reduceFrame(scope, [
          setupExternalFrame(
            { path, meta },
            [
              ...flatMap(node.body, (node) => hoistClosure(mode, node)),
              ...flatMap(node.body, (node) => hoistBlock(mode, node)),
            ],
            { mode },
          ),
        ]);
      }
    } else {
      throw new AranTypeError(situ);
    }
  } else if (situ.kind === "eval") {
    if (situ.scope === "global") {
      if (mode === "strict") {
        const internal = setupRegularFrame(
          { path },
          [
            ...flatMap(node.body, (node) => hoistClosure(mode, node)),
            ...flatMap(node.body, (node) => hoistBlock(mode, node)),
          ],
          null,
        );
        if (situ.ambient === "internal") {
          return reduceFrame(scope, [
            setupGlobalObjectFrame({ path }, []),
            setupGlobalRecordFrame({ path }, []),
            internal,
          ]);
        } else if (situ.ambient === "external") {
          return reduceFrame(scope, [
            setupExternalFrame({ path, meta }, [], { mode }),
            internal,
          ]);
        } else {
          throw new AranTypeError(situ.ambient);
        }
      } else if (mode === "sloppy") {
        const internal = setupRegularFrame(
          { path },
          flatMap(node.body, (node) => hoistBlock(mode, node)),
          null,
        );
        if (situ.ambient === "internal") {
          return reduceFrame(scope, [
            setupGlobalObjectFrame(
              { path },
              flatMap(node.body, (node) => hoistClosure(mode, node)),
            ),
            setupGlobalRecordFrame({ path }, []),
            internal,
          ]);
        } else if (situ.ambient === "external") {
          return reduceFrame(scope, [
            setupExternalFrame(
              { path, meta },
              flatMap(node.body, (node) => hoistClosure(mode, node)),
              { mode },
            ),
            internal,
          ]);
        } else {
          throw new AranTypeError(situ.ambient);
        }
      } else {
        throw new AranTypeError(mode);
      }
    } else if (situ.scope === "local") {
      if (mode === "strict") {
        return reduceFrame(scope, [
          setupRegularFrame(
            { path },
            [
              ...flatMap(node.body, (node) => hoistClosure(mode, node)),
              ...flatMap(node.body, (node) => hoistBlock(mode, node)),
            ],
            null,
          ),
        ]);
      } else if (mode === "sloppy") {
        const internal = setupRegularFrame(
          { path },
          flatMap(node.body, (node) => hoistBlock(mode, node)),
          null,
        );
        if (situ.ambient === "internal") {
          return bindSequence(
            updateScope(
              { path },
              scope,
              flatMap(node.body, (node) => hoistClosure(mode, node)),
            ),
            (scope) => reduceFrame(scope, [internal]),
          );
        } else if (situ.ambient === "external") {
          return reduceFrame(scope, [
            setupExternalFrame(
              { path, meta },
              flatMap(node.body, (node) => hoistClosure(mode, node)),
              { mode },
            ),
            internal,
          ]);
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
    drillSite(node, path, forkMeta((meta = nextMeta(meta))), "body"),
  );
  const block = sequenceClosureBlock(
    bindSequence(
      setupScope(
        { node, path, meta: forkMeta((meta = nextMeta(meta))) },
        scope,
        { mode, situ },
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
