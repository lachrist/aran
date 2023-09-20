import { hoistBlock } from "../../estree/hoist.mjs";
import { flatMap } from "../../util/index.mjs";
import { makeScopeControlBlock } from "../scope/index.mjs";
import { unbuildStatement } from "./statement.mjs";

/**
 * @type {<S>(
 *   node: estree.Statement,
 *   context: import("./context.js").Context<S>,
 *   options: {
 *     labels: unbuild.Label[],
 *     with: unbuild.Variable | null,
 *   },
 * ) => aran.ControlBlock<unbuild.Atom<S>>}
 */
export const unbuildControlBlock = (node, context1, options) => {
  const { serialize, digest } = context1;
  const serial = serialize(node);
  const _hash = digest(node);
  const body = node.type === "BlockStatement" ? node.body : [node];
  return makeScopeControlBlock(
    context1,
    {
      type: "block",
      kinds: hoistBlock(body),
      with: options.with,
    },
    options.labels,
    (context2) =>
      flatMap(body, (child) => unbuildStatement(child, context2, [])),
    serial,
  );
};
