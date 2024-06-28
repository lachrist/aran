/* eslint-disable no-use-before-define */

import { AranTypeError } from "../../error.mjs";
import { flatMap } from "../../util/index.mjs";

/**
 * @type {(
 *   node:import("../../estree").AssignmentProperty | import("../../estree").RestElement,
 * ) => import("../../estree").Variable[]}
 */
const listPropertyVariable = (node) => {
  if (node.type === "Property") {
    return listPatternVariable(node.value);
  } else if (node.type === "RestElement") {
    return listPatternVariable(node);
  } else {
    throw new AranTypeError(node);
  }
};

/** @type {(node: import("../../estree").Pattern | null) => import("../../estree").Variable[]} */
const listElementVariable = (node) => {
  if (node === null) {
    return [];
  } else {
    return listPatternVariable(node);
  }
};

/** @type {(node: import("../../estree").Pattern) => import("../../estree").Variable[]} */
export const listPatternVariable = (node) => {
  if (node.type === "Identifier") {
    return [/** @type {import("../../estree").Variable} */ (node.name)];
  } else if (node.type === "ObjectPattern") {
    return flatMap(node.properties, listPropertyVariable);
  } else if (node.type === "ArrayPattern") {
    return flatMap(node.elements, listElementVariable);
  } else if (node.type === "AssignmentPattern") {
    return listPatternVariable(node.left);
  } else if (node.type === "MemberExpression") {
    return [];
  } else if (node.type === "RestElement") {
    return listPatternVariable(node.argument);
  } /* c8 ignore start */ else {
    throw new AranTypeError(node);
  } /* c8 ignore stop */
};

/* eslint-disable local/no-impure */
/**
 * @type {(
 *   node: import("../../estree").Pattern,
 *   variable: import("../../estree").Variable,
 * ) => boolean}
 */
export const hasPatternVariable = (pattern, variable) => {
  /**
   * @type {(
   *   | import("../../estree").Pattern
   *   | import("../../estree").AssignmentProperty
   * )[]}
   */
  const todo = [pattern];
  let length = 1;
  while (length > 0) {
    length -= 1;
    const node = todo[length];
    if (node.type === "Identifier") {
      if (node.name === variable) {
        return true;
      }
    } else if (node.type === "ArrayPattern") {
      for (const child of node.elements) {
        if (child != null) {
          todo[length] = child;
          length += 1;
        }
      }
    } else if (node.type === "ObjectPattern") {
      for (const child of node.properties) {
        todo[length] = child;
        length += 1;
      }
    } else if (node.type === "Property") {
      todo[length] = node.value;
      length += 1;
    } else if (node.type === "AssignmentPattern") {
      todo[length] = node.left;
      length += 1;
    } else if (node.type === "RestElement") {
      todo[length] = node.argument;
      length += 1;
    } else if (node.type === "MemberExpression") {
      // noop
    } else {
      throw new AranTypeError(node);
    }
  }
  return false;
};
/* eslint-enable local/no-impure */
