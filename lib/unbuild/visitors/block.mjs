import { drillAll, drillArray } from "../../drill.mjs";
import { hoistBlock } from "../query/index.mjs";
import { makeScopeControlBlock } from "../scope/index.mjs";
import { unbuildAllStatement } from "./statement.mjs";

/**
 * @type {(
 *   pair: {
 *     node: estree.Statement,
 *     path: unbuild.Path,
 *   },
 *   context: import("../context.js").Context,
 *   options: {
 *     kinds: Record<estree.Variable, estree.VariableKind>,
 *     labels: unbuild.Label[],
 *     completion: import("./statement.mjs").Completion
 *     loop: {
 *       break: null | unbuild.Label,
 *       continue: null | unbuild.Label,
 *     },
 *   },
 * ) => aran.ControlBlock<unbuild.Atom>}
 */
export const unbuildControlBlock = (
  { node, path },
  context1,
  { kinds, labels, completion, loop },
) => {
  const body =
    node.type === "BlockStatement"
      ? drillAll(drillArray({ node, path }, "body"))
      : [{ node, path }];
  return makeScopeControlBlock(
    context1,
    {
      type: "block",
      kinds: {
        ...kinds,
        ...hoistBlock(node.type === "BlockStatement" ? node.body : [node]),
      },
    },
    labels,
    (context) =>
      unbuildAllStatement(body, context, {
        labels: [],
        completion,
        loop,
      }),
  );
};
