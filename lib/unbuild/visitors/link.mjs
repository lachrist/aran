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
 * @type {<S>(
 *   pair: {
 *     node:
 *       | estree.VariableDeclaration
 *       | estree.FunctionDeclaration
 *       | estree.ClassDeclaration,
 *     path: unbuild.Path,
 *   },
 *   context: import("../context.js").Context<S>,
 * ) => aran.Link<unbuild.Atom<S>>[]}
 */
const unbuildExportDeclaration = ({ node, path }, context) => {
  const { serialize } = context;
  const serial = serialize(node, path);
  switch (node.type) {
    case "VariableDeclaration":
      return map(
        flatMap(node.declarations, (child) => listPatternVariable(child.id)),
        (specifier) =>
          makeExportLink(
            /** @type {estree.Specifier} */ (/** @type {string} */ (specifier)),
            serial,
          ),
      );
    case "FunctionDeclaration":
      return node.id === null
        ? []
        : [
            makeExportLink(
              /** @type {estree.Specifier} */ (node.id.name),
              serial,
            ),
          ];
    case "ClassDeclaration":
      return node.id === null
        ? []
        : [
            makeExportLink(
              /** @type {estree.Specifier} */ (node.id.name),
              serial,
            ),
          ];
    default:
      throw new StaticError("invalid module declaration", node);
  }
};

/**
 * @type {<S>(
 *   pair: {
 *     node: estree.ExportSpecifier,
 *     path: unbuild.Path,
 *   },
 *   context: import("../context.js").Context<S>,
 * ) => aran.Link<unbuild.Atom<S>>}
 */
const unbuildExportSpecifier = ({ node, path }, context) => {
  const { serialize } = context;
  const serial = serialize(node, path);
  return makeExportLink(getSpecifier(node.exported), serial);
};

/**
 * @type {<S>(
 *   pair: {
 *     node:
 *       | estree.ImportSpecifier
 *       | estree.ImportDefaultSpecifier
 *       | estree.ImportNamespaceSpecifier,
 *     path: unbuild.Path,
 *   },
 *   context: import("../context.js").Context<S>,
 *   options: { source: estree.Source },
 * ) => aran.Link<unbuild.Atom<S>>}
 */
const unbuildImportSpecifier = ({ node, path }, context, { source }) => {
  const { serialize } = context;
  const serial = serialize(node, path);
  switch (node.type) {
    case "ImportSpecifier":
      return makeImportLink(source, getSpecifier(node.imported), serial);
    case "ImportNamespaceSpecifier":
      return makeImportLink(source, null, serial);
    case "ImportDefaultSpecifier":
      return makeImportLink(
        source,
        /** @type {estree.Specifier} */ ("default"),
        serial,
      );
    default:
      throw new StaticError("invalid import specifier", node);
  }
};

/**
 * @type {<S>(
 *   pair: {
 *     node: estree.ModuleDeclaration,
 *     path: unbuild.Path,
 *   },
 *   context: import("../context.js").Context<S>,
 * ) => aran.Link<unbuild.Atom<S>>[]}
 */
export const unbuildModuleDeclaration = ({ node, path }, context) => {
  const { serialize } = context;
  const serial = serialize(node, path);
  switch (node.type) {
    case "ImportDeclaration": {
      const source = getSource(node.source);
      return map(drillAll(drillArray({ node, path }, "specifiers")), (pair) =>
        unbuildImportSpecifier(pair, context, { source }),
      );
    }
    case "ExportAllDeclaration":
      return [
        makeAggregateLink(
          getSource(node.source),
          null,
          node.exported === null ? null : getSpecifier(node.exported),
          serial,
        ),
      ];
    case "ExportDefaultDeclaration":
      return [
        makeExportLink(/** @type {estree.Specifier} */ ("default"), serial),
      ];
    case "ExportNamedDeclaration":
      return [
        ...(hasDeclarationExportNamedDeclaration(node)
          ? unbuildExportDeclaration(
              drill({ node, path }, "declaration"),
              context,
            )
          : []),
        ...map(drillAll(drillArray({ node, path }, "specifiers")), (pair) =>
          unbuildExportSpecifier(pair, context),
        ),
      ];
    default:
      throw new StaticError("invalid module declaration", node);
  }
};
