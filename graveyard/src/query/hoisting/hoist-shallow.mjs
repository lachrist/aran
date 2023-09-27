import { flatMap, map } from "array-lite";

import { partialx_, constant_ } from "../../util/index.mjs";

import { DEFAULT_CLAUSE, dispatchObjectNode0 } from "../../node.mjs";

import {
  makeLetDeclaration,
  makeImportDeclaration,
  exportDeclaration,
} from "./declaration.mjs";

import {
  hoistExportSpecifier,
  hoistVariableDeclaration,
  hoistExportVariableDeclaration,
} from "./helper.mjs";

const getImportSpecifier = partialx_(dispatchObjectNode0, {
  ImportSpecifier: (node) => node.imported.name,
  ImportDefaultSpecifier: constant_("default"),
  ImportNamespaceSpecifier: constant_(null),
});

const extractImportDeclaration = (source, node) =>
  makeImportDeclaration(node.local.name, source, getImportSpecifier(node));

export const hoistShallow = partialx_(dispatchObjectNode0, {
  [DEFAULT_CLAUSE]: constant_([]),
  VariableDeclaration: (node) => {
    if (node.kind !== "var") {
      return hoistVariableDeclaration(node);
    } else {
      return [];
    }
  },
  ClassDeclaration: (node) => [makeLetDeclaration(node.id.name)],
  ExportDefaultDeclaration: (node) => {
    if (
      node.declaration.type === "ClassDeclaration" &&
      node.declaration.id !== null
    ) {
      return [
        exportDeclaration(
          makeLetDeclaration(node.declaration.id.name),
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
      if (node.declaration.type === "ClassDeclaration") {
        return [
          exportDeclaration(
            makeLetDeclaration(node.declaration.id.name),
            node.declaration.id.name,
          ),
        ];
      } else if (
        node.declaration.type === "VariableDeclaration" &&
        node.declaration.kind !== "var"
      ) {
        return hoistExportVariableDeclaration(node.declaration);
      } else {
        return [];
      }
    } else {
      return flatMap(node.specifiers, hoistExportSpecifier);
    }
  },
  ImportDeclaration: (node) =>
    map(
      node.specifiers,
      partialx_(extractImportDeclaration, node.source.value),
    ),
});
