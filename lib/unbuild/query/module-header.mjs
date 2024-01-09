import { getSource } from "./source.mjs";
import { DEFAULT_SPECIFIER, getSpecifier } from "./specifier.mjs";
import { listDeclarationVariable } from "./hoist.mjs";
import { AranTypeError } from "../../error.mjs";
import { map } from "../../util/index.mjs";

/**
 * @type {(
 *   node: (
 *     | estree.ImportSpecifier
 *     | estree.ImportDefaultSpecifier
 *     | estree.ImportNamespaceSpecifier
 *   ),
 * ) => estree.Specifier | null}
 */
const getImportSpecifier = (node) => {
  switch (node.type) {
    case "ImportSpecifier": {
      return getSpecifier(node.imported);
    }
    case "ImportNamespaceSpecifier": {
      return null;
    }
    case "ImportDefaultSpecifier": {
      return DEFAULT_SPECIFIER;
    }
    default: {
      throw new AranTypeError(node);
    }
  }
};

/**
 * @type {(
 *   node: estree.ModuleDeclaration | estree.Directive | estree.Statement,
 * ) => import("../../header").ModuleHeader[]}
 */
export const listModuleHeader = (node) => {
  switch (node.type) {
    case "ImportDeclaration": {
      const source = getSource(node.source);
      if (node.specifiers.length === 0) {
        return [
          {
            type: "import",
            source,
            import: null,
          },
        ];
      } else {
        return map(node.specifiers, (specifier) => ({
          type: "import",
          source,
          import: getImportSpecifier(specifier),
        }));
      }
    }
    case "ExportAllDeclaration": {
      const source = getSource(node.source);
      return [
        {
          type: "aggregate",
          source,
          import: null,
          export: null,
        },
      ];
    }
    case "ExportDefaultDeclaration": {
      return [
        {
          type: "export",
          export: DEFAULT_SPECIFIER,
        },
      ];
    }
    case "ExportNamedDeclaration": {
      if (node.source != null) {
        const source = getSource(node.source);
        return map(node.specifiers, (specifier) => ({
          type: "aggregate",
          mode: "strict",
          source,
          import: getSpecifier(specifier.local),
          export: getSpecifier(specifier.exported),
        }));
      } else {
        return /** @type {import("../../header").ExportHeader[]} */ ([
          ...(node.declaration == null
            ? []
            : map(listDeclarationVariable(node.declaration), (variable) => ({
                type: "export",
                mode: "strict",
                export: /** @type {estree.Specifier} */ (
                  /** @type {string} */ (variable)
                ),
              }))),
          ...map(node.specifiers, (specifier) => ({
            type: "export",
            mode: "strict",
            export: getSpecifier(specifier.exported),
          })),
        ]);
      }
    }
    default: {
      return [];
    }
  }
};
