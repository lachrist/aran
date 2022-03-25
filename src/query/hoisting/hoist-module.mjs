import {map, flatMap} from "array-lite";

import {partial1} from "../../util.mjs";

import {collectDeclarator} from "./collect.mjs";

import {
  makeImportDeclaration,
  makeVoidDeclaration,
  makeVarDeclaration,
  makeConstDeclaration,
  makeLetDeclaration,
  makeFunctionDeclaration,
  makeClassDeclaration,
  exportDeclaration,
  getDeclarationVariable,
} from "./declaration.mjs";

const makers = {
  __proto__: null,
  var: makeVarDeclaration,
  const: makeConstDeclaration,
  let: makeLetDeclaration,
};

const type_makers = {
  __proto__: null,
  ClassDeclaration: makeClassDeclaration,
  FunctionDeclaration: makeFunctionDeclaration,
};

const exportSelfDeclaration = (declaration) =>
  exportDeclaration(declaration, getDeclarationVariable(declaration));

const visitExportSpecifier = (node) =>
  exportDeclaration(makeVoidDeclaration(node.local.name), node.exported.name);

const import_specifier_visitors = {
  __proto__: null,
  ImportSpecifier: (source, node) =>
    makeImportDeclaration(node.local.name, source, node.imported.name),
  ImportDefaultSpecifier: (source, node) =>
    makeImportDeclaration(node.local.name, source, "default"),
  ImportNamespaceSpecifier: (source, node) =>
    makeImportDeclaration(node.local.name, source, null),
};

const visitImportSpecifier = (source, node) => {
  const visitor = import_specifier_visitors[node.type];
  return visitor(source, node);
};

const visitors = {
  __proto__: null,
  ExportDefaultDeclaration: (node) => {
    if (
      node.declaration.type === "FunctionDeclaration" &&
      node.declaration.id !== null
    ) {
      return [
        exportDeclaration(
          makeFunctionDeclaration(node.declaration.id.name),
          "default",
        ),
      ];
    } else if (
      node.declaration.type === "ClassDeclaration" &&
      node.declaration.id !== null
    ) {
      return [
        exportDeclaration(
          makeClassDeclaration(node.declaration.id.name),
          "default",
        ),
      ];
    } else {
      return [];
    }
  },
  ExportNamedDeclaration: (node) => {
    if (node.source !== null) {
      return [];
    } else if (node.declaration !== null) {
      if (node.declaration.type === "VariableDeclaration") {
        return map(
          map(
            flatMap(node.declaration.declarations, collectDeclarator),
            makers[node.declaration.kind],
          ),
          exportSelfDeclaration,
        );
      } else {
        const makeDeclaration = type_makers[node.declaration.type];
        return [
          exportSelfDeclaration(makeDeclaration(node.declaration.id.name)),
        ];
      }
    } else {
      return map(node.specifiers, visitExportSpecifier);
    }
  },
  ExportAllDeclaration: (_node) => [],
  ImportDeclaration: (node) =>
    map(node.specifiers, partial1(visitImportSpecifier, node.source.value)),
};

export const hoistModule = (node) => {
  if (node.type in visitors) {
    const visitor = visitors[node.type];
    return visitor(node);
  } else {
    return [];
  }
};
