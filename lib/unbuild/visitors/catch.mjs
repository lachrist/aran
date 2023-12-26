import { listPatternVariable } from "../query/index.mjs";
import { map } from "../../util/index.mjs";
import {
  extendScope,
  getMode,
  makeScopeLoadExpression,
  setupRegularStaticFrame,
} from "../scope/index.mjs";
import { makeBlockStatement, makeEffectStatement } from "../node.mjs";
import { unbuildControlBody } from "./body.mjs";
import { unbuildPattern } from "./pattern.mjs";
import { drillSite } from "../site.mjs";
import {
  mapSequence,
  sequenceControlBlock,
  sequenceEffect,
} from "../sequence.mjs";
import { forkMeta, nextMeta } from "../meta.mjs";
import { cacheConstant } from "../cache.mjs";

const {
  Object: { fromEntries: reduceEntry },
} = globalThis;

/** @type {(variable: estree.Variable) => [estree.Variable, estree.VariableKind]} */
const makeLetEntry = (variable) => [variable, "let"];

/**
 * @type {(
 *   node: estree.CatchClause,
 * ) => node is estree.CatchClause & {
 *   param: estree.Pattern,
 * }}
 */
const hasCatchParam = (node) => node.param != null;

/**
 * @type {(
 *   site: import("../site").Site<estree.CatchClause>,
 *   scope: import("../scope").Scope,
 *   options: {
 *     labels: unbuild.Label[],
 *     completion: import("./statement.d.ts").Completion,
 *     loop: {
 *       break: null | unbuild.Label,
 *       continue: null | unbuild.Label,
 *     },
 *   },
 * ) => aran.ControlBlock<unbuild.Atom>}
 */
export const unbuildCatch = (
  { node, path, meta },
  scope,
  { labels, completion, loop },
) => {
  const mode = getMode(scope);
  if (hasCatchParam(node)) {
    return sequenceControlBlock(
      mapSequence(
        mapSequence(
          setupRegularStaticFrame(
            { path },
            reduceEntry(map(listPatternVariable(node.param), makeLetEntry)),
            { mode, exports: {} },
          ),
          (frame) => extendScope(scope, frame),
        ),
        (scope) => ({
          body: [
            ...map(
              sequenceEffect(
                mapSequence(
                  cacheConstant(
                    forkMeta((meta = nextMeta(meta))),
                    makeScopeLoadExpression(
                      { path, meta: forkMeta((meta = nextMeta(meta))) },
                      scope,
                      { type: "read-error", mode },
                    ),
                    path,
                  ),
                  (right) =>
                    unbuildPattern(
                      drillSite(node, path, meta, "param"),
                      scope,
                      { operation: "initialize", right },
                    ),
                ),
                path,
              ),
              (node) => makeEffectStatement(node, path),
            ),
            makeBlockStatement(
              unbuildControlBody(
                drillSite(
                  node,
                  path,
                  forkMeta((meta = nextMeta(meta))),
                  "body",
                ),
                scope,
                { labels, loop, completion },
              ),
              path,
            ),
          ],
        }),
      ),
      labels,
      path,
    );
  } else {
    return unbuildControlBody(
      drillSite(node, path, forkMeta((meta = nextMeta(meta))), "body"),
      scope,
      { labels, completion, loop },
    );
  }
};
