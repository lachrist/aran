import { flatMap, map } from "array-lite";

import {
  deadcode_,
  partialx_x,
  partialx_,
  constant_,
} from "../../util/index.mjs";

import { applyVisitor } from "../visit.mjs";

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

const getImportSpecifier = partialx_x(
  applyVisitor,
  {
    ImportSpecifier: (node) => node.imported.name,
    ImportDefaultSpecifier: constant_("default"),
    ImportNamespaceSpecifier: constant_(null),
  },
  deadcode_("invalid ImportSpecifier type"),
);

const extractImportDeclaration = (source, node) =>
  makeImportDeclaration(node.local.name, source, getImportSpecifier(node));

export const hoistShallow = partialx_x(
  applyVisitor,
  {
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
  },
  constant_([]),
);
