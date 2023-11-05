import { listPatternVariable } from "../query/index.mjs";
import { AranTypeError, flatMap, map } from "../../util/index.mjs";
import { makeAggregateLink, makeExportLink, makeImportLink } from "../node.mjs";
import { drill, drillAll, drillArray } from "../../drill.mjs";
import { hasDeclarationExportNamedDeclaration } from "../predicate.mjs";
import { DUMMY_SOURCE, logSyntaxError } from "../report.mjs";

/** @type {(node: estree.Identifier) => estree.Specifier} */
const getSpecifier = ({ name }) => /** @type {estree.Specifier} */ (name);

/**
 * @type {(
 *   pair: {
 *     node:
 *       | estree.VariableDeclaration
 *       | estree.FunctionDeclaration
 *       | estree.ClassDeclaration,
 *     path: unbuild.Path,
 *   },
 *   context: import("../context.js").Context,
 *   options: {},
 * ) => (aran.Link<unbuild.Atom>)[]}
 */
const unbuildExportDeclaration = ({ node, path }, _context, {}) => {
  switch (node.type) {
    case "VariableDeclaration": {
      return map(
        flatMap(node.declarations, (child) => listPatternVariable(child.id)),
        (specifier) =>
          makeExportLink(
            /** @type {estree.Specifier} */ (/** @type {string} */ (specifier)),
            path,
          ),
      );
    }
    case "FunctionDeclaration": {
      return node.id === null
        ? []
        : [
            makeExportLink(
              /** @type {estree.Specifier} */ (node.id.name),
              path,
            ),
          ];
    }
    case "ClassDeclaration": {
      return node.id === null
        ? []
        : [
            makeExportLink(
              /** @type {estree.Specifier} */ (node.id.name),
              path,
            ),
          ];
    }
    default: {
      throw new AranTypeError("invalid module declaration", node);
    }
  }
};

/**
 * @type {(
 *   pair: {
 *     node: estree.ExportSpecifier,
 *     path: unbuild.Path,
 *   },
 *   context: import("../context.js").Context,
 *   options: null,
 * ) => aran.Link<unbuild.Atom>}
 */
const unbuildExportSpecifier = ({ node, path }, _context) =>
  makeExportLink(getSpecifier(node.exported), path);

/**
 * @type {(
 *   pair: {
 *     node:
 *       | estree.ImportSpecifier
 *       | estree.ImportDefaultSpecifier
 *       | estree.ImportNamespaceSpecifier,
 *     path: unbuild.Path,
 *   },
 *   context: import("../context.js").Context,
 *   options: { source: estree.Source },
 * ) => aran.Link<unbuild.Atom>}
 */
const unbuildImportSpecifier = ({ node, path }, _context, { source }) => {
  switch (node.type) {
    case "ImportSpecifier": {
      return makeImportLink(source, getSpecifier(node.imported), path);
    }
    case "ImportNamespaceSpecifier": {
      return makeImportLink(source, null, path);
    }
    case "ImportDefaultSpecifier": {
      return makeImportLink(
        source,
        /** @type {estree.Specifier} */ ("default"),
        path,
      );
    }
    default: {
      throw new AranTypeError("invalid import specifier", node);
    }
  }
};

/**
 * @type {(
 *   pair: {
 *     node: estree.ModuleDeclaration,
 *     path: unbuild.Path,
 *   },
 *   context: import("../context.js").Context,
 *   options: null,
 * ) => (aran.Link<unbuild.Atom>)[]}
 */
export const unbuildModuleDeclaration = ({ node, path }, context) => {
  switch (node.type) {
    case "ImportDeclaration": {
      if (typeof node.source.value === "string") {
        return map(drillAll(drillArray({ node, path }, "specifiers")), (pair) =>
          unbuildImportSpecifier(pair, context, {
            source: /** @type {estree.Source} */ (node.source.value),
          }),
        );
      } else {
        return [
          logSyntaxError(
            makeImportLink(DUMMY_SOURCE, null, path),
            `Illegal source type: ${typeof node.source.value}`,
          ),
        ];
      }
    }
    case "ExportAllDeclaration": {
      if (typeof node.source.value === "string") {
        return [
          makeAggregateLink(
            /** @type {estree.Source} */ (node.source.value),
            null,
            node.exported === null ? null : getSpecifier(node.exported),
            path,
          ),
        ];
      } else {
        return [
          logSyntaxError(
            makeAggregateLink(DUMMY_SOURCE, null, null, path),
            `Illegal source type: ${typeof node.source.value}`,
          ),
        ];
      }
    }
    case "ExportDefaultDeclaration": {
      return [
        makeExportLink(/** @type {estree.Specifier} */ ("default"), path),
      ];
    }
    case "ExportNamedDeclaration": {
      return [
        ...(hasDeclarationExportNamedDeclaration(node)
          ? unbuildExportDeclaration(
              drill({ node, path }, "declaration"),
              context,
              {},
            )
          : []),
        ...map(drillAll(drillArray({ node, path }, "specifiers")), (pair) =>
          unbuildExportSpecifier(pair, context, null),
        ),
      ];
    }
    default: {
      throw new AranTypeError("invalid module declaration", node);
    }
  }
};
