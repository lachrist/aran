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
 *   node: estree.ImportDeclaration,
 * ) => import("../../header").ModuleHeader[]}
 */
export const listImportHeader = (node) => {
  const source = getSource(node.source);
  if (node.specifiers.length === 0) {
    return [
      {
        type: "import",
        mode: "strict",
        source,
        import: null,
      },
    ];
  } else {
    return map(node.specifiers, (specifier) => ({
      type: "import",
      mode: "strict",
      source,
      import: getImportSpecifier(specifier),
    }));
  }
};

/**
 * @type {(
 *   node: estree.ExportDefaultDeclaration,
 * ) => import("../../header").ModuleHeader[]}
 */
export const listDefaultExportHeader = (_node) => [
  {
    type: "export",
    mode: "strict",
    export: DEFAULT_SPECIFIER,
  },
];

/**
 * @type {(
 *   node: estree.ExportAllDeclaration,
 * ) => import("../../header").ModuleHeader[]}
 */
export const listAllExportHeader = (node) => [
  {
    type: "aggregate",
    mode: "strict",
    source: getSource(node.source),
    import: null,
    export: null,
  },
];

/**
 * @type {(
 *   node: estree.ExportNamedDeclaration,
 * ) => import("../../header").ModuleHeader[]}
 */
export const listNameExportHeader = (node) => {
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
};
