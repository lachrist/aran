import { drill, drillArray } from "../site.mjs";
import { hoistBlock, hoistClosure } from "../query/index.mjs";
import { extendStaticScope } from "../scope/index.mjs";
import { listBodyStatement } from "./statement.mjs";
import { filterOutObject, includes } from "../../util/index.mjs";
import {
  bindSequence,
  sequenceControlBlock,
  tellSequence,
} from "../sequence.mjs";

/**
 * @type {(
 *   site: import("../site.d.ts").Site<estree.BlockStatement>,
 *   context: import("../context.js").Context,
 *   options: {
 *     parameters: estree.Variable[],
 *   },
 * ) => aran.ControlBlock<unbuild.Atom>}
 */
export const unbuildClosureBody = (
  { node, path, meta },
  context,
  { parameters },
) =>
  sequenceControlBlock(
    bindSequence(
      extendStaticScope({ path }, context, {
        frame: {
          situ: "local",
          link: null,
          kinds: {
            ...filterOutObject(
              hoistClosure(context.mode, node.body),
              ([variable, _kind]) => includes(parameters, variable),
            ),
            ...hoistBlock(context.mode, node.body),
          },
        },
      }),
      (context) =>
        tellSequence(
          listBodyStatement(
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
        ),
    ),
    [],
    path,
  );

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
