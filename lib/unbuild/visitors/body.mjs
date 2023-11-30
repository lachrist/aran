import { drill, drillArray } from "../site.mjs";
import { hoistBlock, hoistClosure } from "../query/index.mjs";
import { makeScopeControlBlock } from "../scope/index.mjs";
import { listBodyStatement } from "./statement.mjs";
import { filterOutObject, includes } from "../../util/index.mjs";

/**
 * @type {(
 *   site: import("../site.mjs").Site<estree.BlockStatement>,
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
  makeScopeControlBlock(
    context,
    {
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
    [],
    (context) =>
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
    path,
  );

/**
 * @type {(
 *   site: import("../site.mjs").Site<estree.Statement>,
 *   context: import("../context.js").Context,
 *   options: {
 *     labels: unbuild.Label[],
 *     completion: import("./statement.mjs").Completion
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
  makeScopeControlBlock(
    context,
    {
      situ: "local",
      link: null,
      kinds: hoistBlock(
        context.mode,
        node.type === "BlockStatement" ? node.body : [node],
      ),
    },
    labels,
    (context) =>
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
    path,
  );
