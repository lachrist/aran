/* eslint-disable no-use-before-define */

import { flatMap, map } from "../../util/index.mjs";
import { AranTypeError } from "../../error.mjs";

/**
 * @type {(
 *   node:estree.AssignmentProperty | estree.RestElement,
 * ) => estree.Variable[]}
 */
const listPropertyVariable = (node) => {
  if (node.type === "Property") {
    return listPatternVariable(node.value);
  } else if (node.type === "RestElement") {
    return listPatternVariable(node);
  } /* c8 ignore start */ else {
    throw new AranTypeError(node);
  } /* c8 ignore stop */
};

/** @type {(node: estree.Pattern | null) => estree.Variable[]} */
const listElementVariable = (node) => {
  if (node === null) {
    return [];
  } else {
    return listPatternVariable(node);
  }
};

/** @type {(node: estree.Pattern) => estree.Variable[]} */
export const listPatternVariable = (node) => {
  if (node.type === "Identifier") {
    return [/** @type {estree.Variable} */ (node.name)];
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

/** @type {(node: estree.VariableDeclarator) => estree.Variable[]} */
export const listDeclaratorVariable = (node) => listPatternVariable(node.id);

/**
 * @type {(
 *   node: (
 *     | estree.VariableDeclaration
 *     | estree.FunctionDeclaration
 *     | estree.ClassDeclaration
 *   ),
 * ) => estree.Variable[]}
 */
export const listDeclarationVariable = (node) => {
  switch (node.type) {
    case "VariableDeclaration": {
      return flatMap(node.declarations, listDeclaratorVariable);
    }
    case "FunctionDeclaration": {
      return node.id === null
        ? []
        : [/** @type {estree.Variable} */ (node.id.name)];
    }
    case "ClassDeclaration": {
      return node.id === null
        ? []
        : [/** @type {estree.Variable} */ (node.id.name)];
    }
    default: {
      throw new AranTypeError(node);
    }
  }
};

/** @type {(variable: estree.Variable) => [estree.Variable, "var"]} */
const makeVarEntry = (variable) => [variable, "var"];

/** @type {(variable: estree.Variable) => [estree.Variable, "let"]} */
const makeLetEntry = (variable) => [variable, "let"];

/** @type {(variable: estree.Variable) => [estree.Variable, "const"]} */
const makeConstEntry = (variable) => [variable, "const"];

/**
 * @type {(
 *   mode: "strict" | "sloppy",
 *   node: estree.Node,
 * ) => [estree.Variable, "var"][]}
 */
export const hoistClosure = (mode, node) => {
  if (node.type === "BlockStatement") {
    return flatMap(node.body, (node) => hoistClosure(mode, node));
  } else if (node.type === "FunctionDeclaration") {
    if (node.id == null) {
      return [];
    } else {
      switch (mode) {
        case "strict": {
          return [];
        }
        case "sloppy": {
          return [[/** @type {estree.Variable} */ (node.id.name), "var"]];
        }
        default: {
          throw new AranTypeError(mode);
        }
      }
    }
  } else if (node.type === "VariableDeclaration") {
    if (node.kind === "var") {
      return map(
        flatMap(node.declarations, listDeclaratorVariable),
        makeVarEntry,
      );
    } else {
      return [];
    }
  } else if (node.type === "IfStatement") {
    return [
      ...hoistClosure(mode, node.consequent),
      ...(node.alternate == null ? [] : hoistClosure(mode, node.alternate)),
    ];
  } else if (node.type === "TryStatement") {
    return [
      ...hoistClosure(mode, node.block),
      ...(node.handler == null ? [] : hoistClosure(mode, node.handler)),
      ...(node.finalizer == null ? [] : hoistClosure(mode, node.finalizer)),
    ];
  } else if (node.type === "CatchClause") {
    return hoistClosure(mode, node.body);
  } else if (node.type === "ForStatement") {
    return [
      ...(node.init == null ? [] : hoistClosure(mode, node.init)),
      ...hoistClosure(mode, node.body),
    ];
  } else if (node.type === "ForInStatement" || node.type === "ForOfStatement") {
    return [...hoistClosure(mode, node.left), ...hoistClosure(mode, node.body)];
  } else if (
    node.type === "WhileStatement" ||
    node.type === "DoWhileStatement" ||
    node.type === "LabeledStatement" ||
    node.type === "WithStatement"
  ) {
    return hoistClosure(mode, node.body);
  } else if (node.type === "SwitchStatement") {
    return flatMap(node.cases, (node) => hoistClosure(mode, node));
  } else if (node.type === "SwitchCase") {
    return flatMap(node.consequent, (node) => hoistClosure(mode, node));
  } else if (
    node.type === "ExportNamedDeclaration" ||
    node.type === "ExportDefaultDeclaration"
  ) {
    return node.declaration == null ? [] : hoistClosure(mode, node.declaration);
  } else {
    return [];
  }
};

/**
 * @type {(
 *   mode: "strict" | "sloppy",
 *   node: estree.Node,
 * ) => [estree.Variable, "let" | "const"][]}
 */
export const hoistBlock = (mode, node) => {
  if (node.type === "VariableDeclaration") {
    if (node.kind === "let") {
      return map(
        flatMap(node.declarations, listDeclaratorVariable),
        makeLetEntry,
      );
    } else if (node.kind === "const") {
      return map(
        flatMap(node.declarations, listDeclaratorVariable),
        makeConstEntry,
      );
    } else {
      return [];
    }
  } else if (node.type === "FunctionDeclaration") {
    if (node.id == null) {
      return [];
    } else {
      switch (mode) {
        case "strict": {
          return [[/** @type {estree.Variable} */ (node.id.name), "let"]];
        }
        case "sloppy": {
          return [];
        }
        default: {
          throw new AranTypeError(mode);
        }
      }
    }
  } else if (node.type === "ClassDeclaration") {
    return node.id == null
      ? []
      : [[/** @type {estree.Variable} */ (node.id.name), "let"]];
  } else if (node.type === "SwitchCase") {
    return flatMap(node.consequent, (node) => hoistBlock(mode, node));
  } else if (node.type === "LabeledStatement") {
    return hoistBlock(mode, node.body);
  } else if (
    node.type === "ExportNamedDeclaration" ||
    node.type === "ExportDefaultDeclaration"
  ) {
    return node.declaration == null ? [] : hoistBlock(mode, node.declaration);
  } else {
    return [];
  }
};
