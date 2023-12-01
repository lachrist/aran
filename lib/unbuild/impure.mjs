import { isMetaVariable } from "./mangle.mjs";
import { makeExpressionEffect } from "./node.mjs";

/**
 * @type {(
 *   node: aran.Expression<unbuild.Atom>,
 *   path: unbuild.Path,
 * ) => aran.Effect<unbuild.Atom>[]}
 */
export const listImpureEffect = (node, path) => {
  if (node.type === "ReadExpression" && isMetaVariable(node.variable)) {
    return [];
  } else {
    return [makeExpressionEffect(node, path)];
  }
};
