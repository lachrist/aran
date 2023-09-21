import { DynamicSyntaxAranError, StaticSyntaxAranError } from "../../error.mjs";
import { listPatternVariable } from "../../estree/hoist.mjs";
import { flatMap, map } from "../../util/index.mjs";
import { makeAggregateLink, makeExportLink, makeImportLink } from "../node.mjs";

/** @type {(node: estree.Literal) => estree.Source} */
const getSource = (node) => {
  if (typeof node.value === "string") {
    return /** @type {estree.Source} */ (node.value);
  } else {
    throw new DynamicSyntaxAranError("Source must be a string", node);
  }
};

/** @type {(node: estree.Identifier) => estree.Specifier} */
const getSpecifier = ({ name }) => /** @type {estree.Specifier} */ (name);

/**
 * @type {<S>(
 *   node:
 *     | estree.VariableDeclaration
 *     | estree.FunctionDeclaration
 *     | estree.ClassDeclaration,
 *   context: import("./context.d.ts").Context<S>,
 * ) => aran.Link<unbuild.Atom<S>>[]}
 */
const unbuildExportDeclaration = (node, context) => {
  const { serialize } = context;
  const serial = serialize(node);
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
      throw new StaticSyntaxAranError("module declaration", node);
  }
};

/**
 * @type {<S>(
 *   node: estree.ExportSpecifier,
 *   context: import("./context.d.ts").Context<S>,
 * ) => aran.Link<unbuild.Atom<S>>}
 */
const unbuildExportSpecifier = (node, context) => {
  const { serialize } = context;
  const serial = serialize(node);
  return makeExportLink(getSpecifier(node.exported), serial);
};

/**
 * @type {<S>(
 *   node:
 *     | estree.ImportSpecifier
 *     | estree.ImportDefaultSpecifier
 *     | estree.ImportNamespaceSpecifier,
 *   context: import("./context.d.ts").Context<S>,
 *   options: { source: estree.Source },
 * ) => aran.Link<unbuild.Atom<S>>}
 */
const unbuildImportSpecifier = (node, context, { source }) => {
  const { serialize } = context;
  const serial = serialize(node);
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
      throw new StaticSyntaxAranError("import specifier", node);
  }
};

/**
 * @type {<S>(
 *   node: estree.ProgramStatement,
 *   context: import("./context.d.ts").Context<S>,
 * ) => aran.Link<unbuild.Atom<S>>[]}
 */
export const unbuildLink = (node, context) => {
  const { serialize } = context;
  const serial = serialize(node);
  switch (node.type) {
    case "ImportDeclaration": {
      const source = getSource(node.source);
      return map(node.specifiers, (child) =>
        unbuildImportSpecifier(child, context, { source }),
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
        ...(node.declaration == null
          ? []
          : unbuildExportDeclaration(node.declaration, context)),
        ...map(node.specifiers, (child) =>
          unbuildExportSpecifier(child, context),
        ),
      ];
    default:
      return [];
  }
};
