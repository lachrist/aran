import { drill, drillArray } from "../site.mjs";
import { hoistBlock, hoistClosure } from "../query/index.mjs";
import {
  extendStaticScope,
  listScopeInitializeEffect,
  makeScopeReadExpression,
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
  listenSequence,
  mapSequence,
  passSequence,
  sequenceControlBlock,
  tellSequence,
} from "../sequence.mjs";
import { cacheConstant, makeReadCacheExpression } from "../cache.mjs";
import { splitMeta, zipMeta } from "../mangle.mjs";
import { makeBlockStatement, makeEffectStatement } from "../node.mjs";

/**
 * @type {(
 *   site: import("../site.d.ts").Site<estree.BlockStatement>,
 *   context: import("../context.js").Context,
 *   options: {
 *     parameters: estree.Variable[],
 *   },
 * ) => aran.Statement<unbuild.Atom>[]}
 */
export const unbuildClosureBody = (
  { node, path, meta },
  context,
  { parameters },
) => {
  const closure_record = hoistClosure(context.mode, node.body);
  const block_record = hoistBlock(context.mode, node.body);
  if (
    listKey(closure_record).length === 0 &&
    listKey(block_record).length === 0
  ) {
    return listBodyStatement(
      drillArray(drill({ node, path, meta }, ["body"]).body),
      context,
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
    return listenSequence(
      bindSequence(
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
                passSequence(
                  cacheConstant(
                    metas.cache,
                    makeScopeReadExpression(
                      { path, meta: metas.read },
                      context,
                      {
                        variable,
                      },
                    ),
                    path,
                  ),
                  (node) => makeEffectStatement(node, path),
                ),
                (cache) => pairup(variable, cache),
              );
            },
          ),
        ),
        (entries) =>
          tellSequence([
            makeBlockStatement(
              sequenceControlBlock(
                bindSequence(
                  extendStaticScope({ path }, context, {
                    frame: {
                      situ: "local",
                      link: null,
                      kinds: { ...closure_record, ...block_record },
                    },
                  }),
                  (context) =>
                    tellSequence([
                      ...flatMap(
                        zipMeta(metas.init, entries),
                        ([meta, [variable, cache]]) =>
                          map(
                            listScopeInitializeEffect({ path, meta }, context, {
                              variable,
                              right: makeReadCacheExpression(cache, path),
                            }),
                            (node) => makeEffectStatement(node, path),
                          ),
                      ),
                      ...listBodyStatement(
                        drillArray(drill({ node, path, meta }, ["body"]).body),
                        context,
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
          ]),
      ),
    );
  }
};

/**
 * @type {(
 *   site: import("../site.d.ts").Site<estree.Statement>,
 *   context: import("../context.js").Context,
 *   options: {
 *     labels: unbuild.Label[],
 *     completion: import("./statement.d.ts").Completion
 *     loop: {
 *       break: null | unbuild.Label,
 *       continue: null | unbuild.Label,
 *     },
 *   },
 * ) => aran.ControlBlock<unbuild.Atom>}
 */
export const unbuildControlBody = (
  { node, path, meta },
  context,
  { labels, completion, loop },
) =>
  sequenceControlBlock(
    bindSequence(
      extendStaticScope({ path }, context, {
        frame: {
          situ: "local",
          link: null,
          kinds: hoistBlock(
            context.mode,
            node.type === "BlockStatement" ? node.body : [node],
          ),
        },
      }),
      (context) =>
        tellSequence(
          listBodyStatement(
            node.type === "BlockStatement"
              ? drillArray(drill({ node, path, meta }, ["body"]).body)
              : [{ node, path, meta }],
            context,
            {
              parent: "block",
              labels: [],
              completion,
              loop,
            },
          ),
        ),
    ),
    labels,
    path,
  );
