/* eslint-disable no-use-before-define */

import { flatMap, map } from "../../util/index.mjs";
import { AranTypeError } from "../../error.mjs";

const {
  Object: { fromEntries: reduceEntry },
} = globalThis;

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
    throw new AranTypeError("invalid property estree node", node);
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
    throw new AranTypeError("invalid pattern estree node", node);
  } /* c8 ignore stop */
};

/** @type {(node: estree.VariableDeclarator) => estree.Variable[]} */
export const listDeclaratorVariable = (node) => listPatternVariable(node.id);

/** @type {(variable: estree.Variable) => [estree.Variable, "var"]} */
const makeVarEntry = (variable) => [variable, "var"];

/** @type {(variable: estree.Variable) => [estree.Variable, "let"]} */
const makeLetEntry = (variable) => [variable, "let"];

/** @type {(variable: estree.Variable) => [estree.Variable, "const"]} */
const makeConstEntry = (variable) => [variable, "const"];

/** @type {(variable: estree.Variable) => [estree.Variable, "import"]} */
const makeImportEntry = (variable) => [variable, "import"];

/** @type {(node: estree.Node) => [estree.Variable, "var" | "function"][]} */
const hoistClosureEntry = (node) => {
  if (node.type === "BlockStatement") {
    return flatMap(node.body, hoistClosureEntry);
  } else if (node.type === "FunctionDeclaration") {
    return node.id === null
      ? []
      : [[/** @type {estree.Variable} */ (node.id.name), "function"]];
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
      ...hoistClosureEntry(node.consequent),
      ...(node.alternate == null ? [] : hoistClosureEntry(node.alternate)),
    ];
  } else if (node.type === "TryStatement") {
    return [
      ...hoistClosureEntry(node.block),
      ...(node.handler == null ? [] : hoistClosureEntry(node.handler)),
      ...(node.finalizer == null ? [] : hoistClosureEntry(node.finalizer)),
    ];
  } else if (node.type === "CatchClause") {
    return hoistClosureEntry(node.body);
  } else if (node.type === "ForStatement") {
    return [
      ...(node.init == null ? [] : hoistClosureEntry(node.init)),
      ...hoistClosureEntry(node.body),
    ];
  } else if (node.type === "ForInStatement" || node.type === "ForOfStatement") {
    return [...hoistClosureEntry(node.left), ...hoistClosureEntry(node.body)];
  } else if (
    node.type === "WhileStatement" ||
    node.type === "DoWhileStatement" ||
    node.type === "LabeledStatement" ||
    node.type === "WithStatement"
  ) {
    return hoistClosureEntry(node.body);
  } else if (node.type === "SwitchStatement") {
    return flatMap(node.cases, hoistClosureEntry);
  } else if (node.type === "SwitchCase") {
    return flatMap(node.consequent, hoistClosureEntry);
  } else if (
    node.type === "ExportNamedDeclaration" ||
    node.type === "ExportDefaultDeclaration"
  ) {
    return node.declaration == null ? [] : hoistClosureEntry(node.declaration);
  } else {
    return [];
  }
};

/**
 * @type {(
 *   nodes: estree.Node[],
 * ) => Record<estree.Variable, estree.ClosureVariableKind>}
 */
export const hoistClosure = (nodes) =>
  reduceEntry(flatMap(nodes, hoistClosureEntry));

/**
 * @type {(
 *   node:
 *     | estree.ImportSpecifier
 *     | estree.ImportDefaultSpecifier
 *     | estree.ImportNamespaceSpecifier,
 * ) => estree.Variable}
 */
const getImportVariable = (node) =>
  /** @type {estree.Variable} */ (node.local.name);

/**
 * @type {(
 *   node: estree.Node,
 * ) => [estree.Variable, estree.BlockVariableKind][]}
 */
const hoistBlockEntry = (node) => {
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
    return node.id === null
      ? []
      : [[/** @type {estree.Variable} */ (node.id.name), "class"]];
  } else if (node.type === "SwitchCase") {
    return flatMap(node.consequent, hoistBlockEntry);
  } else if (
    node.type === "ExportNamedDeclaration" ||
    node.type === "ExportDefaultDeclaration"
  ) {
    return node.declaration == null ? [] : hoistBlockEntry(node.declaration);
  } else if (node.type === "ImportDeclaration") {
    return map(map(node.specifiers, getImportVariable), makeImportEntry);
  } else {
    return [];
  }
};

/**
 * @type {(
 *   nodes: estree.Node[],
 * ) => Record<estree.Variable, estree.BlockVariableKind>}
 */
export const hoistBlock = (nodes) =>
  reduceEntry(flatMap(nodes, hoistBlockEntry));
