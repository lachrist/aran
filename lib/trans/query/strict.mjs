/**
 * @type {(
 *   nodes: import("estree-sentry").ModuleStatement<{}>[],
 * ) => boolean}
 */
export const hasUseStrictDirective = (nodes) => {
  for (const node of nodes) {
    if (node.type !== "ExpressionStatement") {
      return false;
    }
    if (node.expression.type !== "Literal") {
      return false;
    }
    if (typeof node.expression.value !== "string") {
      return false;
    }
    if (node.directive === "use strict") {
      return true;
    }
    if (
      node.expression.raw === '"use strict"' ||
      node.expression.raw === "'use strict'"
    ) {
      return true;
    }
  }
  return false;
};
