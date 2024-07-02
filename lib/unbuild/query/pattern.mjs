/* eslint-disable no-use-before-define */

import { AranTypeError } from "../../error.mjs";

/* eslint-disable local/no-impure */
/**
 * @type {(
 *   node: import("../../estree").Pattern,
 * ) => import("../../estree").Variable[]}
 */
export const listPatternVariable = (node) => {
  /** @type {import("../../estree").Variable[]} */
  const variables = [];
  /**
   * @type {(
   *   | import("../../estree").Pattern
   *   | import("../../estree").AssignmentProperty
   *   | import("../../estree").RestElement
   *  )[]}
   */
  const todo = [node];
  let length = 1;
  while (length > 0) {
    length -= 1;
    const node = todo[length];
    if (node.type === "Identifier") {
      variables[variables.length] =
        /** @type {import("../../estree").Variable} */ (node.name);
    } else if (node.type === "MemberExpression") {
      // noop
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
    } else {
      throw new AranTypeError(node);
    }
  }
  return variables;
};
/* eslint-enable local/no-impure */

/**
 * @type {(
 *   node: import("../../estree").VariableDeclarator,
 * ) => import("../../estree").Variable[]}
 */
export const listDeclaratorVariable = ({ id }) => listPatternVariable(id);

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
