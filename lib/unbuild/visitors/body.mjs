import { drillAll, drillArray } from "../../drill.mjs";
import { hoistBlock, hoistClosure } from "../query/index.mjs";
import { makeScopeControlBlock } from "../scope/index.mjs";
import { listBodyStatement } from "./statement.mjs";

const CLOSURE_BODY = {
  parent: /** @type {"closure"} */ ("closure"),
  labels: /** @type {[]} */ ([]),
  completion: null,
  loop: {
    break: null,
    continue: null,
  },
};

/**
 * @type {(
 *   pair: {
 *     node: estree.BlockStatement,
 *     path: unbuild.Path,
 *   },
 *   context: import("../context.js").Context,
 * ) => aran.ControlBlock<unbuild.Atom>}
 */
export const unbuildClosureBody = ({ node, path }, context) =>
  makeScopeControlBlock(
    context,
    {
      type: "block",
      kinds: {
        ...hoistClosure(node.body),
        ...hoistBlock(node.body),
      },
    },
    [],
    (context) =>
      listBodyStatement(
        drillAll(drillArray({ node, path }, "body")),
        context,
        CLOSURE_BODY,
      ),
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
  { labels, completion, loop },
) =>
  makeScopeControlBlock(
    context,
    {
      type: "block",
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
          parent: "block",
          labels: [],
          completion,
          loop,
        },
      ),
    path,
  );
