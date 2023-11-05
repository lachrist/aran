import { drillAll, drillArray } from "../../drill.mjs";
import { hoistBlock, hoistClosure } from "../query/index.mjs";
import { makeScopeControlBlock } from "../scope/index.mjs";
import { listBodyStatement } from "./statement.mjs";

/**
 * @type {(
 *   pair: {
 *     node: estree.BlockStatement,
 *     path: unbuild.Path,
 *   },
 *   context: import("../context.js").Context,
 *   options: {
 *     meta: unbuild.RootMeta,
 *   },
 * ) => aran.ControlBlock<unbuild.Atom>}
 */
export const unbuildClosureBody = ({ node, path }, context, { meta }) =>
  makeScopeControlBlock(
    context,
    {
      type: "block",
      this: null,
      catch: false,
      kinds: {
        ...hoistClosure(node.body),
        ...hoistBlock(node.body),
      },
    },
    [],
    (context) =>
      listBodyStatement(drillAll(drillArray({ node, path }, "body")), context, {
        meta,
        parent: "closure",
        labels: [],
        completion: null,
        loop: {
          break: null,
          continue: null,
        },
      }),
    path,
  );

/**
 * @type {(
 *   pair: {
 *     node: estree.Statement,
 *     path: unbuild.Path,
 *   },
 *   context: import("../context.js").Context,
 *   options: {
 *     meta: unbuild.RootMeta,
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
  { node, path },
  context,
  { meta, labels, completion, loop },
) =>
  makeScopeControlBlock(
    context,
    {
      type: "block",
      this: null,
      catch: false,
      kinds: hoistBlock(node.type === "BlockStatement" ? node.body : [node]),
    },
    labels,
    (context) =>
      listBodyStatement(
        node.type === "BlockStatement"
          ? drillAll(drillArray({ node, path }, "body"))
          : [{ node, path }],
        context,
        {
          meta,
          parent: "block",
          labels: [],
          completion,
          loop,
        },
      ),
    path,
  );
