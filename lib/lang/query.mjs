import { someChild } from "./syntax.mjs";

/**
 * @type {(
 *   node: import("./syntax.d.ts").Node<import("./syntax.d.ts").Atom>,
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
 *   node: import("./syntax.d.ts").Node<import("./syntax.d.ts").Atom>,
 * ) => boolean}
 */
const compileHasClosureParameter = (parameter) => {
  /**
   * @type {(node: import("./syntax.d.ts").Node<import("./syntax.d.ts").Atom>) => boolean}
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
 *   node: import("./syntax.d.ts").Node<import("./syntax.d.ts").Atom>,
 * ) => boolean}
 */
const compileHasFunctionParameter = (parameter) => {
  /**
   * @type {(node: import("./syntax.d.ts").Node<import("./syntax.d.ts").Atom>) => boolean}
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
 *     | "scope.writeStrict"
 *     | "scope.writeSloppy"
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
 *   node: import("./syntax.d.ts").Node<import("./syntax.d.ts").Atom>,
 * ) => boolean}
 */
const compileHasProgramParameter = (parameter) => {
  /**
   * @type {(node: import("./syntax.d.ts").Node<import("./syntax.d.ts").Atom>) => boolean}
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
 *   [key in import("./syntax.d.ts").Parameter]: (node: import("./syntax.d.ts").Node<import("./syntax.d.ts").Atom>) => boolean
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
  "scope.writeStrict": compileHasProgramParameter("scope.writeStrict"),
  "scope.writeSloppy": compileHasProgramParameter("scope.writeSloppy"),
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
 *   node: import("./syntax.d.ts").Node<import("./syntax.d.ts").Atom>,
 *   parameter: import("./syntax.d.ts").Parameter,
 * ) => boolean}
 */
export const hasParameter = (node, parameter) => {
  const predicate = predicates[parameter];
  return predicate(node);
};

/**
 * @type {(
 *   node: import("./syntax.d.ts").Node<import("./syntax.d.ts").Atom>,
 * ) => boolean}
 */
export const hasEvalCall = (node) => {
  if (node.type === "EvalExpression") {
    return true;
  } else {
    return someChild(node, hasEvalCall);
  }
};
