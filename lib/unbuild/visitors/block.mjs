import { drillAll, drillArray } from "../../drill.mjs";
import { wrapOrigin } from "../origin.mjs";
import { hoistBlock } from "../query/index.mjs";
import { makeScopeControlBlock } from "../scope/index.mjs";
import { listBodyStatement } from "./statement.mjs";

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
export const unbuildControlBlock = wrapOrigin(
  ({ node, path }, context1, { kinds, labels, completion, loop }) =>
    makeScopeControlBlock(
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
        listBodyStatement(
          node.type === "BlockStatement"
            ? drillAll(drillArray({ node, path }, "body"))
            : [{ node, path }],
          context,
          {
            labels: [],
            completion,
            loop,
          },
        ),
    ),
);
