import { listPatternVariable } from "../query/index.mjs";
import { map } from "../../util/index.mjs";
import {
  extendScope,
  getMode,
  makeScopeLoadExpression,
  setupRegularFrame,
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

/** @type {(variable: estree.Variable) => [estree.Variable, "let"]} */
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
 * ) => import("../sequence").ControlBlockSequence}
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
          setupRegularFrame(
            { path },
            map(listPatternVariable(node.param), makeLetEntry),
            null,
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
                      { kind: "let", right },
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
                { kind: "catch", labels, loop, completion },
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
      { kind: "catch", labels, completion, loop },
    );
  }
};
