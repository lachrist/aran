import { someChild } from "./lang.mjs";

/**
 * @type {(
 *   node: import("./lang").Node<import("./lang").Atom>,
 * ) => boolean}
 */
export const hasCatchErrorParameter = (node) => {
  if (
    node.type === "EvalExpression" ||
    (node.type === "ReadExpression" && node.variable === "catch.error")
  ) {
    return true;
  } else {
    if (node.type === "TryStatement") {
      return (
        hasCatchErrorParameter(node.try) || hasCatchErrorParameter(node.finally)
      );
    } else {
      return someChild(node, hasCatchErrorParameter);
    }
  }
};

/**
 * @type {(
 *   parameter: "function.callee" | "function.arguments",
 * ) => (
 *   node: import("./lang").Node<import("./lang").Atom>,
 * ) => boolean}
 */
const compileHasClosureParameter = (parameter) => {
  /**
   * @type {(node: import("./lang").Node<import("./lang").Atom>) => boolean}
   */
  const predicate = (node) => {
    if (
      node.type === "EvalExpression" ||
      (node.type === "ReadExpression" && node.variable === parameter)
    ) {
      return true;
    } else {
      if (node.type === "ClosureExpression") {
        return false;
      } else {
        return someChild(node, predicate);
      }
    }
  };
  return predicate;
};

/**
 * @type {(
 *   parameter: "new.target" | "this",
 * ) => (
 *   node: import("./lang").Node<import("./lang").Atom>,
 * ) => boolean}
 */
const compileHasFunctionParameter = (parameter) => {
  /**
   * @type {(node: import("./lang").Node<import("./lang").Atom>) => boolean}
   */
  const predicate = (node) => {
    if (
      node.type === "EvalExpression" ||
      (node.type === "ReadExpression" && node.variable === parameter)
    ) {
      return true;
    } else {
      if (node.type === "ClosureExpression" && node.kind === "function") {
        return false;
      } else {
        return someChild(node, predicate);
      }
    }
  };
  return predicate;
};

/**
 * @type {(
 *   parameter: (
 *     | "import.meta"
 *     | "import"
 *     | "scope.read"
 *     | "scope.typeof"
 *     | "scope.write"
 *     | "scope.discard"
 *     | "private.check"
 *     | "private.has"
 *     | "private.get"
 *     | "private.set"
 *     | "super.set"
 *     | "super.get"
 *     | "super.call"
 *   ),
 * ) => (
 *   node: import("./lang").Node<import("./lang").Atom>,
 * ) => boolean}
 */
const compileHasProgramParameter = (parameter) => {
  /**
   * @type {(node: import("./lang").Node<import("./lang").Atom>) => boolean}
   */
  const predicate = (node) => {
    if (
      node.type === "EvalExpression" ||
      (node.type === "ReadExpression" && node.variable === parameter)
    ) {
      return true;
    } else {
      return someChild(node, predicate);
    }
  };
  return predicate;
};

/**
 * @type {{
 *   [key in import("./lang").Parameter]: (node: import("./lang").Node<import("./lang").Atom>) => boolean
 * }}
 */
const predicates = {
  "catch.error": hasCatchErrorParameter,
  "function.callee": compileHasClosureParameter("function.callee"),
  "function.arguments": compileHasClosureParameter("function.arguments"),
  "new.target": compileHasFunctionParameter("new.target"),
  "this": compileHasFunctionParameter("this"),
  "import.meta": compileHasProgramParameter("import.meta"),
  "import": compileHasProgramParameter("import"),
  "scope.read": compileHasProgramParameter("scope.read"),
  "scope.typeof": compileHasProgramParameter("scope.typeof"),
  "scope.write": compileHasProgramParameter("scope.write"),
  "scope.discard": compileHasProgramParameter("scope.discard"),
  "private.check": compileHasProgramParameter("private.check"),
  "private.has": compileHasProgramParameter("private.has"),
  "private.get": compileHasProgramParameter("private.get"),
  "private.set": compileHasProgramParameter("private.set"),
  "super.set": compileHasProgramParameter("super.set"),
  "super.get": compileHasProgramParameter("super.get"),
  "super.call": compileHasProgramParameter("super.call"),
};

/**
 * @type {(
 *   node: import("./lang").Node<import("./lang").Atom>,
 *   parameter: import("./lang").Parameter,
 * ) => boolean}
 */
export const hasParameter = (node, parameter) => {
  const predicate = predicates[parameter];
  return predicate(node);
};

/**
 * @type {(
 *   node: import("./lang").Node<import("./lang").Atom>,
 * ) => boolean}
 */
export const hasEvalCall = (node) => {
  if (node.type === "EvalExpression") {
    return true;
  } else {
    return someChild(node, hasEvalCall);
  }
};
