import { listChildren } from "estree-sentry";
import { some } from "../../util/index.mjs";

/**
 * @type {(
 *   node: import("estree-sentry").Node<{}>,
 * ) => boolean}
 */
export const hasTaggedTemplate = (node) => {
  if (node.type === "TaggedTemplateExpression") {
    return true;
  } else {
    return some(listChildren(node), hasTaggedTemplate);
  }
};
