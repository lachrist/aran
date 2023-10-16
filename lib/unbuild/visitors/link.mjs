import { SyntaxAranError } from "../../error.mjs";
import { listPatternVariable } from "../query/index.mjs";
import { StaticError, flatMap, map } from "../../util/index.mjs";
import { makeAggregateLink, makeExportLink, makeImportLink } from "../node.mjs";
import { drill, drillAll, drillArray } from "../../drill.mjs";
import { hasDeclarationExportNamedDeclaration } from "../predicate.mjs";

/** @type {(node: estree.Literal) => estree.Source} */
const getSource = (node) => {
  if (typeof node.value === "string") {
    return /** @type {estree.Source} */ (node.value);
  } else {
    throw new SyntaxAranError("Source must be a string", node);
  }
};

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
 *   options: null,
 * ) => (aran.Link<unbuild.Atom>)[]}
 */
const unbuildExportDeclaration = ({ node, path }, _context) => {
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
      throw new StaticError("invalid module declaration", node);
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
      throw new StaticError("invalid import specifier", node);
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
      const source = getSource(node.source);
      return map(drillAll(drillArray({ node, path }, "specifiers")), (pair) =>
        unbuildImportSpecifier(pair, context, { source }),
      );
    }
    case "ExportAllDeclaration": {
      return [
        makeAggregateLink(
          getSource(node.source),
          null,
          node.exported === null ? null : getSpecifier(node.exported),
          path,
        ),
      ];
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
              null,
            )
          : []),
        ...map(drillAll(drillArray({ node, path }, "specifiers")), (pair) =>
          unbuildExportSpecifier(pair, context, null),
        ),
      ];
    }
    default: {
      throw new StaticError("invalid module declaration", node);
    }
  }
};
