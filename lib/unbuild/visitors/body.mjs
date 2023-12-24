import { drill, drillArray } from "../site.mjs";
import { hoistBlock, hoistClosure } from "../query/index.mjs";
import {
  extendScope,
  getMode,
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
  bindSequence,
  flatSequence,
  mapSequence,
  sequenceControlBlock,
  sequenceStatement,
  tellSequence,
} from "../sequence.mjs";
import { cacheConstant, makeReadCacheExpression } from "../cache.mjs";
import { splitMeta, zipMeta } from "../mangle.mjs";
import { makeBlockStatement, makeEffectStatement } from "../node.mjs";

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
    return listBodyStatement(
      drillArray(drill({ node, path, meta }, ["body"]).body),
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
    );
  } else {
    const metas = splitMeta(meta, ["drill", "clash", "init"]);
    return sequenceStatement(
      mapSequence(
        flatSequence(
          map(
            zipMeta(
              metas.clash,
              filter(listKey(closure_record), (variable) =>
                includes(parameters, variable),
              ),
            ),
            ([meta, variable]) => {
              const metas = splitMeta(meta, ["cache", "read"]);
              return mapSequence(
                cacheConstant(
                  metas.cache,
                  makeScopeReadExpression({ path, meta: metas.read }, scope, {
                    variable,
                  }),
                  path,
                ),
                (cache) => pairup(variable, cache),
              );
            },
          ),
        ),
        (entries) => [
          makeBlockStatement(
            sequenceControlBlock(
              bindSequence(
                extendStaticScope({ path }, scope, {
                  frame: {
                    situ: "local",
                    link: null,
                    kinds: { ...closure_record, ...block_record },
                  },
                }),
                (scope) =>
                  tellSequence([
                    ...flatMap(
                      zipMeta(metas.init, entries),
                      ([meta, [variable, cache]]) =>
                        map(
                          listScopeInitializeEffect({ path, meta }, scope, {
                            variable,
                            right: makeReadCacheExpression(cache, path),
                          }),
                          (node) => makeEffectStatement(node, path),
                        ),
                    ),
                    ...listBodyStatement(
                      drillArray(drill({ node, path, meta }, ["body"]).body),
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
            ? drillArray(drill({ node, path, meta }, ["body"]).body)
            : [{ node, path, meta }],
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
