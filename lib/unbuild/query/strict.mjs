/* eslint-disable local/no-impure */

import { getOwn } from "../../util/index.mjs";

/**
 * @type {(
 *   nodes: (
 *     | estree.Directive
 *     | estree.Statement
 *     | estree.ModuleDeclaration
 *   )[],
 * ) => boolean}
 */
export const hasUseStrictDirective = (nodes) => {
  const { length } = nodes;
  for (let index = 0; index < length; index += 1) {
    const node = nodes[index];
    if (
      node.type === "ExpressionStatement" &&
      node.expression.type === "Literal" &&
      typeof node.expression.value === "string"
    ) {
      const raw = getOwn(node.expression, "raw");
      if (typeof raw === "string") {
        if (raw === '"use strict"' || raw === "'use strict'") {
          return true;
        }
      } else {
        if (node.expression.value === "use strict") {
          return true;
        }
      }
    } else {
      return false;
    }
  }
  return false;
};
/* eslint-disable local/no-impure */
