import { hoistBlock } from "../../estree/hoist.mjs";
import { makeScopeControlBlock } from "../scope/index.mjs";
import { unbuildAllStatement } from "./statement.mjs";

/**
 * @type {<S>(
 *   node: estree.Statement,
 *   context: import("../context.js").Context<S>,
 *   options: {
 *     kinds: Record<estree.Variable, estree.VariableKind>,
 *     labels: unbuild.Label[],
 *     completion: import("./statement.mjs").Completion
 *     with: unbuild.Variable | null,
 *     loop: {
 *       break: null | unbuild.Label,
 *       continue: null | unbuild.Label,
 *     },
 *   },
 * ) => aran.ControlBlock<unbuild.Atom<S>>}
 */
export const unbuildControlBlock = (
  node,
  context1,
  { kinds, labels, completion, with: with_, loop },
) => {
  const { serialize } = context1;
  const serial = serialize(node);
  const body = node.type === "BlockStatement" ? node.body : [node];
  return makeScopeControlBlock(
    context1,
    {
      type: "block",
      kinds: {
        ...kinds,
        ...hoistBlock(body),
      },
      with: with_,
    },
    labels,
    (context) =>
      unbuildAllStatement(body, context, { labels: [], completion, loop }),
    serial,
  );
};
