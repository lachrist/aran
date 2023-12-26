import { hoistBlock, hoistClosure } from "../query/index.mjs";
import {
  extendScope,
  getMode,
  listScopeSaveEffect,
  makeScopeLoadExpression,
  setupRegularStaticFrame,
} from "../scope/index.mjs";
import { listBodyStatement } from "./statement.mjs";
import {
  filter,
  flatMap,
  includes,
  listKey,
  map,
  pairup,
} from "../../util/index.mjs";
import {
  flatSequence,
  mapSequence,
  sequenceControlBlock,
  sequenceStatement,
} from "../sequence.mjs";
import { cacheConstant } from "../cache.mjs";
import { makeBlockStatement, makeEffectStatement } from "../node.mjs";
import { forkMeta, nextMeta } from "../meta.mjs";
import { drillSite } from "../site.mjs";

/**
 * @type {(
 *   site: import("../site.d.ts").Site<estree.BlockStatement>,
 *   scope: import("../scope").Scope,
 *   options: {
 *     parameters: estree.Variable[],
 *   },
 * ) => aran.Statement<unbuild.Atom>[]}
 */
export const unbuildClosureBody = (
  { node, path, meta },
  scope,
  { parameters },
) => {
  const closure_record = hoistClosure(getMode(scope), node.body);
  const block_record = hoistBlock(getMode(scope), node.body);
  if (
    listKey(closure_record).length === 0 &&
    listKey(block_record).length === 0
  ) {
    return listBodyStatement(drillSite(node, path, meta, "body"), scope, {
      parent: "closure",
      labels: [],
      completion: null,
      loop: {
        break: null,
        continue: null,
      },
    });
  } else {
    return sequenceStatement(
      mapSequence(
        flatSequence(
          map(
            filter(listKey(closure_record), (variable) =>
              includes(parameters, variable),
            ),
            (variable) =>
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
                (cache) => pairup(variable, cache),
              ),
          ),
        ),
        (entries) => [
          makeBlockStatement(
            sequenceControlBlock(
              mapSequence(
                mapSequence(
                  setupRegularStaticFrame(
                    { path },
                    { ...closure_record, ...block_record },
                    { mode: getMode(scope), exports: {} },
                  ),
                  (frame) => extendScope(scope, frame),
                ),
                (scope) => ({
                  body: [
                    ...flatMap(entries, ([variable, cache]) =>
                      map(
                        listScopeSaveEffect({ path, meta }, scope, {
                          type: "initialize",
                          mode: getMode(scope),
                          variable,
                          right: cache,
                        }),
                        (node) => makeEffectStatement(node, path),
                      ),
                    ),
                    ...listBodyStatement(
                      drillSite(node, path, meta, "body"),
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
                  ],
                }),
              ),
              [],
              path,
            ),
            path,
          ),
        ],
      ),
      path,
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
 * ) => aran.ControlBlock<unbuild.Atom>}
 */
export const unbuildControlBody = (
  { node, path, meta },
  scope,
  { labels, completion, loop },
) =>
  sequenceControlBlock(
    mapSequence(
      setupRegularStaticFrame(
        { path },
        hoistBlock(
          getMode(scope),
          node.type === "BlockStatement" ? node.body : [node],
        ),
        {
          mode: getMode(scope),
          exports: {},
        },
      ),
      (frame) => ({
        body: listBodyStatement(
          node.type === "BlockStatement"
            ? drillSite(node, path, meta, "body")
            : { node: [node], path, meta },
          extendScope(scope, frame),
          {
            parent: "block",
            labels: [],
            completion,
            loop,
          },
        ),
      }),
    ),
    labels,
    path,
  );
