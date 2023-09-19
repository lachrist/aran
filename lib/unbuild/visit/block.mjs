import { hoistBlock } from "../../estree/hoist.mjs";
import { flatMap } from "../../util/index.mjs";
import { makeLayerControlBlock } from "../layer/build.mjs";
import {
  extendScope,
  listScopeDeclareStatement,
  listScopeVariable,
} from "../scope/index.mjs";
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
  const kinds = hoistBlock(body);
  const context2 = {
    ...context1,
    scope: extendScope(context1.strict, context1.scope, kinds, {
      type: "block",
      with: options.with,
    }),
  };
  return makeLayerControlBlock(
    options.labels,
    [
      ...(context1.super === null ? [] : [context1.super]),
      ...(context1.super_constructor === null
        ? []
        : [context1.super_constructor]),
    ],
    listScopeVariable(context2.strict, context2.scope),
    [
      ...listScopeDeclareStatement(context2.strict, context2.scope, serial),
      ...flatMap(body, (child) => unbuildStatement(child, context2, [])),
    ],
    serial,
  );
};
