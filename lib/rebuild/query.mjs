import { someChild } from "../lang.mjs";

/**
 * @type {(
 *   node: aran.Node<rebuild.Atom>,
 * ) => boolean}
 */
export const hasCatchErrorParameter = (node) => {
  if (node.type === "ReadExpression" && node.variable === "catch.error") {
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
 *   node: aran.Node<rebuild.Atom>,
 * ) => boolean}
 */
const compileHasClosureParameter = (parameter) => {
  /**
   * @type {(node: aran.Node<rebuild.Atom>) => boolean}
   */
  const predicate = (node) => {
    if (node.type === "ReadExpression" && node.variable === parameter) {
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
 *   node: aran.Node<rebuild.Atom>,
 * ) => boolean}
 */
const compileHasFunctionParameter = (parameter) => {
  /**
   * @type {(node: aran.Node<rebuild.Atom>) => boolean}
   */
  const predicate = (node) => {
    if (node.type === "ReadExpression" && node.variable === parameter) {
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
 *     | "import.dynamic"
 *     | "read.strict"
 *     | "read.sloppy"
 *     | "typeof.strict"
 *     | "typeof.sloppy"
 *     | "write.strict"
 *     | "write.sloppy"
 *     | "discard.sloppy"
 *     | "private.has"
 *     | "private.get"
 *     | "private.set"
 *     | "super.set"
 *     | "super.get"
 *     | "super.call"
 *   ),
 * ) => (
 *   node: aran.Node<rebuild.Atom>,
 * ) => boolean}
 */
const compileHasProgramParameter = (parameter) => {
  /**
   * @type {(node: aran.Node<rebuild.Atom>) => boolean}
   */
  const predicate = (node) => {
    if (node.type === "ReadExpression" && node.variable === parameter) {
      return true;
    } else {
      return someChild(node, predicate);
    }
  };
  return predicate;
};

/**
 * @type {{
 *   [key in aran.Parameter]: (node: aran.Node<rebuild.Atom>) => boolean
 * }}
 */
const predicates = {
  "catch.error": hasCatchErrorParameter,
  "function.callee": compileHasClosureParameter("function.callee"),
  "function.arguments": compileHasClosureParameter("function.arguments"),
  "new.target": compileHasFunctionParameter("new.target"),
  "this": compileHasFunctionParameter("this"),
  "import.meta": compileHasProgramParameter("import.meta"),
  "import.dynamic": compileHasProgramParameter("import.dynamic"),
  "read.strict": compileHasProgramParameter("read.strict"),
  "read.sloppy": compileHasProgramParameter("read.sloppy"),
  "typeof.strict": compileHasProgramParameter("typeof.strict"),
  "typeof.sloppy": compileHasProgramParameter("typeof.sloppy"),
  "write.strict": compileHasProgramParameter("write.strict"),
  "write.sloppy": compileHasProgramParameter("write.sloppy"),
  "discard.sloppy": compileHasProgramParameter("discard.sloppy"),
  "private.has": compileHasProgramParameter("private.has"),
  "private.get": compileHasProgramParameter("private.get"),
  "private.set": compileHasProgramParameter("private.set"),
  "super.set": compileHasProgramParameter("super.set"),
  "super.get": compileHasProgramParameter("super.get"),
  "super.call": compileHasProgramParameter("super.call"),
};

/**
 * @type {(
 *   node: aran.Node<rebuild.Atom>,
 *   parameter: aran.Parameter,
 * ) => boolean}
 */
export const hasParameter = (node, parameter) => {
  const predicate = predicates[parameter];
  return predicate(node);
};
