import {
  hasDirectEvalCall,
  hoistBlock,
  hoistClosure,
} from "../query/index.mjs";
import {
  extendScope,
  getMode,
  listScopeSaveEffect,
  makeScopeLoadExpression,
  setupEvalFrame,
  setupRegularFrame,
} from "../scope/index.mjs";
import { listBodyStatement } from "./statement.mjs";
import { filter, flatMap, includes, map, some } from "../../util/index.mjs";
import {
  bindSequence,
  flatSequence,
  mapSequence,
  mapTwoSequence,
  sequenceStatement,
  zeroSequence,
} from "../sequence.mjs";
import { cacheConstant } from "../cache.mjs";
import {
  concatEffect,
  concatStatement,
  makeBlockStatement,
  makeControlBlock,
  makeControlBody,
  makeEffectStatement,
} from "../node.mjs";
import { forkMeta, nextMeta } from "../meta.mjs";
import { drillSite, drillSiteArray } from "../site.mjs";

/**
 * @type {(
 *   site: import("../site").Site<estree.BlockStatement>,
 *   scope: import("../scope").Scope,
 *   options: {
 *     parameters: estree.Variable[],
 *   },
 * ) => import("../sequence").StatementSequence}
 */
export const unbuildClosureBody = (
  { node, path, meta },
  scope,
  { parameters },
) => {
  const mode = getMode(scope);
  const dynamic = mode === "sloppy" && some(node.body, hasDirectEvalCall);
  const hoisting1 = flatMap(node.body, (node) => hoistClosure(mode, node));
  const hoisting2 = flatMap(node.body, (node) => hoistBlock(mode, node));
  if (hoisting1.length === 0 && hoisting2.length === 0) {
    return bindSequence(
      dynamic
        ? mapTwoSequence(
            zeroSequence(scope),
            setupEvalFrame({ path, meta: forkMeta((meta = nextMeta(meta))) }),
            extendScope,
          )
        : zeroSequence(scope),
      (scope) =>
        listBodyStatement(
          drillSiteArray(drillSite(node, path, meta, "body")),
          scope,
          {
            parent: "closure",
            labels: [],
            completion: null,
            loop: {
              break: null,
              continue: null,
            },
          },
        ),
    );
  } else {
    return sequenceStatement(
      bindSequence(
        flatSequence(
          map(
            filter(hoisting1, ({ variable }) => includes(parameters, variable)),
            ({ variable, kind }) =>
              mapSequence(
                cacheConstant(
                  forkMeta((meta = nextMeta(meta))),
                  makeScopeLoadExpression(
                    { path, meta: forkMeta((meta = nextMeta(meta))) },
                    scope,
                    { type: "read", mode: getMode(scope), variable },
                  ),
                  path,
                ),
                (cache) =>
                  /** @type {import("../scope").InitializeOperation} */ ({
                    type: "initialize",
                    mode,
                    kind,
                    variable,
                    right: cache,
                  }),
              ),
          ),
        ),
        (operations) =>
          makeBlockStatement(
            makeControlBlock(
              [],
              bindSequence(
                mapTwoSequence(
                  dynamic
                    ? mapTwoSequence(
                        zeroSequence(scope),
                        setupEvalFrame({
                          path,
                          meta: forkMeta((meta = nextMeta(meta))),
                        }),
                        extendScope,
                      )
                    : zeroSequence(scope),
                  setupRegularFrame({ path }, [...hoisting1, ...hoisting2]),
                  extendScope,
                ),
                (scope) =>
                  makeControlBody(
                    concatStatement([
                      makeEffectStatement(
                        concatEffect(
                          map(operations, (operation) =>
                            listScopeSaveEffect(
                              { path, meta },
                              scope,
                              operation,
                            ),
                          ),
                        ),
                        path,
                      ),
                      listBodyStatement(
                        drillSiteArray(drillSite(node, path, meta, "body")),
                        scope,
                        {
                          parent: "closure",
                          labels: [],
                          completion: null,
                          loop: {
                            break: null,
                            continue: null,
                          },
                        },
                      ),
                    ]),
                  ),
              ),
              path,
            ),
            path,
          ),
      ),
    );
  }
};

/**
 * @type {(
 *   site: import("../site").Site<estree.Statement>,
 *   scope: import("../scope").Scope,
 *   options: {
 *     labels: unbuild.Label[],
 *     completion: import("./statement").Completion
 *     loop: {
 *       break: null | unbuild.Label,
 *       continue: null | unbuild.Label,
 *     },
 *   },
 * ) => import("../sequence").ControlBlockSequence}
 */
export const unbuildControlBody = (
  { node, path, meta },
  scope,
  { labels, completion, loop },
) => {
  const mode = getMode(scope);
  return makeControlBlock(
    labels,
    bindSequence(
      mapSequence(
        setupRegularFrame(
          { path },
          node.type === "BlockStatement"
            ? flatMap(node.body, (node) => hoistBlock(mode, node))
            : hoistBlock(mode, node),
        ),
        (frame) => extendScope(scope, frame),
      ),
      (scope) =>
        makeControlBody(
          listBodyStatement(
            node.type === "BlockStatement"
              ? drillSiteArray(drillSite(node, path, meta, "body"))
              : [{ node, path, meta }],
            scope,
            {
              parent: "block",
              labels: [],
              completion,
              loop,
            },
          ),
        ),
    ),
    path,
  );
};
