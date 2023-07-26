/* eslint-disable no-use-before-define */

import { concat$$, concat$$$, flatMap, map } from "../util/index.mjs";
const {
  TypeError,
  Object: { fromEntries: reduceEntry },
} = globalThis;

/** @type {(node:EstreeAssignmentProperty | EstreeRestElement) => Variable[]} */
export const listPropertyVariable = (node) => {
  if (node.type === "Property") {
    return listPatternVariable(node.value);
  } else if (node.type === "RestElement") {
    return listPatternVariable(node);
  } else {
    throw new TypeError("invalid property type");
  }
};

/** @type {(node: EstreePattern | null) => Variable[]} */
export const listElementVariable = (node) => {
  if (node === null) {
    return [];
  } else {
    return listPatternVariable(node);
  }
};

/** @type {(node: EstreePattern) => Variable[]} */
export const listPatternVariable = (node) => {
  if (node.type === "Identifier") {
    return [node.name];
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
  } else {
    throw new TypeError("invalid pattern type");
  }
};

/** @type {(node: EstreeVariableDeclarator) => Variable[]} */
export const listDeclaratorVariable = (node) => listPatternVariable(node.id);

/**@type {<K extends "var" | "let" | "const">(kind: K) => (variable: Variable) => [Variable, K]} */
const compileMakeEntry = (kind) => (variable) => [variable, kind];

export const makeVarEntry = compileMakeEntry("var");

export const makeLetEntry = compileMakeEntry("let");

export const makeConstEntry = compileMakeEntry("const");

/** @type {(node: EstreeNode) => [Variable, "var" | "function"][]} */
export const hoistClosureInner = (node) => {
  if (node.type === "BlockStatement") {
    return flatMap(node.body, hoistClosureInner);
  } else if (node.type === "FunctionDeclaration") {
    return node.id === null ? [] : [[node.id.name, "function"]];
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
    return concat$$(
      hoistClosureInner(node.consequent),
      node.alternate == null ? [] : hoistClosureInner(node.alternate),
    );
  } else if (node.type === "TryStatement") {
    return concat$$$(
      hoistClosureInner(node.block),
      node.handler == null ? [] : hoistClosureInner(node.handler),
      node.finalizer == null ? [] : hoistClosureInner(node.finalizer),
    );
  } else if (node.type === "CatchClause") {
    return hoistClosureInner(node.body);
  } else if (
    node.type === "LabeledStatement" ||
    node.type === "WithStatement" ||
    node.type === "WhileStatement" ||
    node.type === "DoWhileStatement" ||
    node.type === "ForStatement" ||
    node.type === "ForInStatement" ||
    node.type === "ForOfStatement"
  ) {
    return hoistClosureInner(node.body);
  } else if (node.type === "SwitchStatement") {
    return flatMap(node.cases, hoistClosureInner);
  } else if (node.type === "SwitchCase") {
    return flatMap(node.consequent, hoistClosureInner);
  } else {
    return [];
  }
};

/** @type {(nodes: EstreeNode[]) => Record<Variable, "function" | "var">} */
export const hoistClosure = (nodes) =>
  reduceEntry(flatMap(nodes, hoistClosureInner));

/** @type {(node: EstreeNode) => [Variable, "let" | "const" | "class"][]} */
export const hoistBlockInner = (node) => {
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
  } else if (node.type === "ClassDeclaration") {
    return node.id === null ? [] : [[node.id.name, "class"]];
  } else if (node.type === "SwitchCase") {
    return flatMap(node.consequent, hoistBlockInner);
  } else {
    return [];
  }
};

/** @type {(nodes: EstreeNode[]) => Record<Variable, "let" | "const" | "class">} */
export const hoistBlock = (nodes) =>
  reduceEntry(flatMap(nodes, hoistBlockInner));
