import { listPatternVariable, makeLetHoist } from "../query/index.mjs";
import { concatX_, map } from "../../util/index.mjs";
import {
  CATCH_FRAME,
  extendScope,
  getMode,
  makeScopeLoadExpression,
  setupRegularFrame,
} from "../scope/index.mjs";
import {
  listEffectStatement,
  makeBlockStatement,
  makeControlBlock,
} from "../node.mjs";
import { unbuildControlBody } from "./body.mjs";
import { unbuildPattern } from "./pattern.mjs";
import { drillSite } from "../site.mjs";
import {
  bindSequence,
  callSequence_X_,
  liftSequenceXX,
  liftSequenceX_,
  liftSequence__X_,
  mapSequence,
} from "../../sequence.mjs";
import { forkMeta, nextMeta } from "../meta.mjs";
import { cacheConstant } from "../cache.mjs";
import { incorporatePrefixEffect } from "../prefix.mjs";
import { incorporateDeclarationControlBlock } from "../declaration.mjs";

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
 *     completion: import("../completion").StatementCompletion,
 *     loop: {
 *       break: null | unbuild.Label,
 *       continue: null | unbuild.Label,
 *     },
 *   },
 * ) => import("../../sequence").Sequence<
 *   import("../prelude").BodyPrelude,
 *   aran.ControlBlock<unbuild.Atom>,
 * >}
 */
export const unbuildCatch = (
  { node, path, meta },
  scope,
  { labels, completion, loop },
) => {
  const mode = getMode(scope);
  if (hasCatchParam(node)) {
    return incorporateDeclarationControlBlock(
      liftSequence__X_(
        makeControlBlock,
        labels,
        [],
        bindSequence(
          mapSequence(
            setupRegularFrame(
              { path },
              map(listPatternVariable(node.param), makeLetHoist),
            ),
            (frame) => extendScope(extendScope(scope, CATCH_FRAME), frame),
          ),
          (scope) =>
            liftSequenceXX(
              concatX_,
              liftSequenceX_(
                listEffectStatement,
                incorporatePrefixEffect(
                  bindSequence(
                    callSequence_X_(
                      cacheConstant,
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
                path,
              ),
              liftSequenceX_(
                makeBlockStatement,
                incorporateDeclarationControlBlock(
                  liftSequence__X_(
                    makeControlBlock,
                    labels,
                    [],
                    unbuildControlBody(
                      drillSite(
                        node,
                        path,
                        forkMeta((meta = nextMeta(meta))),
                        "body",
                      ),
                      scope,
                      { loop, completion },
                    ),
                    path,
                  ),
                ),
                path,
              ),
            ),
        ),
        path,
      ),
    );
  } else {
    return incorporateDeclarationControlBlock(
      liftSequence__X_(
        makeControlBlock,
        labels,
        [],
        unbuildControlBody(
          drillSite(node, path, forkMeta((meta = nextMeta(meta))), "body"),
          extendScope(scope, { type: "catch" }),
          { completion, loop },
        ),
        path,
      ),
    );
  }
};
