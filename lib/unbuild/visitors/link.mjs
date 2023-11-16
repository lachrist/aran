import { listPatternVariable } from "../query/index.mjs";
import { flatMap, map } from "../../util/index.mjs";
import { AranTypeError } from "../../error.mjs";
import {
  makeAggregateLink,
  makeExportLink,
  makeImportLink,
  report,
} from "../node.mjs";
import { drill, drillArray } from "../site.mjs";
import { isNotNullishSite } from "../predicate.mjs";

/** @type {(node: estree.Identifier) => estree.Specifier} */
const getSpecifier = ({ name }) => /** @type {estree.Specifier} */ (name);

/**
 * @type {(
 *   site: import("../site.mjs").Site<(
 *     | estree.VariableDeclaration
 *     | estree.FunctionDeclaration
 *     | estree.ClassDeclaration
 *   )>,
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
 *   site: import("../site.mjs").Site<estree.ExportSpecifier>,
 *   context: import("../context.js").Context,
 *   options: {},
 * ) => aran.Link<unbuild.Atom>}
 */
const unbuildExportSpecifier = ({ node, path }, _context, {}) =>
  makeExportLink(getSpecifier(node.exported), path);

/**
 * @type {(
 *   site: import("../site.mjs").Site<(
 *     | estree.ImportSpecifier
 *     | estree.ImportDefaultSpecifier
 *     | estree.ImportNamespaceSpecifier
 *   )>,
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
 *   site: import("../site.mjs").Site<estree.ModuleDeclaration>,
 *   context: import("../context.js").Context,
 *   options: {},
 * ) => (aran.Link<unbuild.Atom>)[]}
 */
export const unbuildModuleDeclaration = ({ node, path, meta }, context, {}) => {
  switch (node.type) {
    case "ImportDeclaration": {
      const sites = drill({ node, path, meta }, ["specifiers"]);
      if (typeof node.source.value === "string") {
        return map(drillArray(sites.specifiers), (pair) =>
          unbuildImportSpecifier(pair, context, {
            source: /** @type {estree.Source} */ (node.source.value),
          }),
        );
      } else {
        return [
          report(
            makeImportLink(
              /** @type {estree.Source} */ ("ARAN_ILLEGAL_SOURCE"),
              null,
              path,
            ),
            {
              name: "SyntaxError",
              message: `Illegal source type: ${typeof node.source.value}`,
            },
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
          report(
            makeAggregateLink(
              /** @type {estree.Source} */ ("ARAN_ILLEGAL_SOURCE"),
              null,
              null,
              path,
            ),
            {
              name: "SyntaxError",
              message: `Illegal source type: ${typeof node.source.value}`,
            },
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
      const sites = drill({ node, path, meta }, ["declaration", "specifiers"]);
      return [
        ...(isNotNullishSite(sites.declaration)
          ? unbuildExportDeclaration(sites.declaration, context, {})
          : []),
        ...map(drillArray(sites.specifiers), (site) =>
          unbuildExportSpecifier(site, context, {}),
        ),
      ];
    }
    default: {
      throw new AranTypeError("invalid module declaration", node);
    }
  }
};
