import { listPatternVariable, makeLetHoist } from "../query/index.mjs";
import { map } from "../../util/index.mjs";
import {
  extendScope,
  getMode,
  makeScopeLoadExpression,
  setupRegularFrame,
} from "../scope/index.mjs";
import {
  concatStatement,
  makeBlockStatement,
  makeControlBlock,
  makeControlBody,
  makeEffectStatement,
} from "../node.mjs";
import { unbuildControlBody } from "./body.mjs";
import { unbuildPattern } from "./pattern.mjs";
import { drillSite } from "../site.mjs";
import { bindSequence, mapSequence, sequenceEffect } from "../sequence.mjs";
import { forkMeta, nextMeta } from "../meta.mjs";
import { cacheConstant } from "../cache.mjs";

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
 * ) => import("../sequence").ControlBlockSequence}
 */
export const unbuildCatch = (
  { node, path, meta },
  scope,
  { labels, completion, loop },
) => {
  const mode = getMode(scope);
  if (hasCatchParam(node)) {
    return makeControlBlock(
      labels,
      bindSequence(
        mapSequence(
          setupRegularFrame(
            { path },
            map(listPatternVariable(node.param), makeLetHoist),
          ),
          (frame) => extendScope(extendScope(scope, { type: "catch" }), frame),
        ),
        (scope) =>
          makeControlBody(
            concatStatement([
              makeEffectStatement(
                sequenceEffect(
                  bindSequence(
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
                        { kind: "let", right },
                      ),
                  ),
                ),
                path,
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
            ]),
          ),
      ),
      path,
    );
  } else {
    return unbuildControlBody(
      drillSite(node, path, forkMeta((meta = nextMeta(meta))), "body"),
      extendScope(scope, { type: "catch" }),
      { labels, completion, loop },
    );
  }
};
