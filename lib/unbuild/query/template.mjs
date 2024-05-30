import { some } from "../../util/index.mjs";
import { listChild } from "./child.mjs";

/**
 * @type {(
 *   node: import("../../estree").Node,
 * ) => boolean}
 */
export const hasTaggedTemplate = (node) => {
  if (node.type === "TaggedTemplateExpression") {
    return true;
  } else {
    return some(listChild(node), hasTaggedTemplate);
  }
};
