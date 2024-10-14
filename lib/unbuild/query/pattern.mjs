import { AranTypeError } from "../../error.mjs";

/* eslint-disable local/no-impure */
/**
 * @type {(
 *   node: import("estree-sentry").RestablePattern<
 *     {}
 *   >,
 * ) => import("estree-sentry").VariableName[]}
 */
export const listPatternVariable = (node) => {
  /** @type {import("estree-sentry").VariableName[]} */
  const variables = [];
  /**
   * @type {(
   *   | import("estree-sentry").RestablePattern<{}>
   *   | import("estree-sentry").PatternProperty<{}>
   *  )[]}
   */
  const todo = [node];
  let length = 1;
  while (length > 0) {
    length -= 1;
    const node = todo[length];
    if (node.type === "Identifier") {
      variables[variables.length] =
        /** @type {import("estree-sentry").VariableName} */ (node.name);
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
 *   node: import("estree-sentry").VariableDeclarator<{}>,
 * ) => import("estree-sentry").VariableName[]}
 */
export const listDeclaratorVariable = ({ id }) => listPatternVariable(id);

/* eslint-disable local/no-impure */
/**
 * @type {(
 *   node: import("estree-sentry").RestablePattern<{}>,
 *   variable: import("estree-sentry").VariableName,
 * ) => boolean}
 */
export const hasPatternVariable = (pattern, variable) => {
  /**
   * @type {(
   *   | import("estree-sentry").RestablePattern<{}>
   *   | import("estree-sentry").PatternProperty<{}>
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
