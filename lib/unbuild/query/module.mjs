import { AranTypeError } from "../../error.mjs";
import { EMPTY, flatMap, map } from "../../util/index.mjs";
import { listDeclaratorVariable } from "./pattern.mjs";
import { getSource } from "./source.mjs";
import {
  DEFAULT_SPECIFIER,
  getSpecifier,
  selfSpecifier,
} from "./specifier.mjs";

/** @type {import("../../header").ExportHeader} */
const DEFAULT_EXPORT_HEADER = {
  type: "export",
  mode: "strict",
  export: DEFAULT_SPECIFIER,
};

/**
 * @type {(
 *   node: import("../../estree").ExportSpecifier,
 * ) => import("../../header").ExportHeader}
 */
const makeSpecifierExportHeader = (node) => ({
  type: "export",
  mode: "strict",
  export: getSpecifier(node.exported),
});

/**
 * @type {(
 *   variable: import("../../estree").Variable,
 * ) => import("../../header").ExportHeader}
 */
const makeSelfExportHoist = (variable) => ({
  type: "export",
  mode: "strict",
  export: selfSpecifier(variable),
});

/**
 * @type {(
 *   node: import("estree").Declaration,
 * ) => import("../../header").ExportHeader[]}
 */
const makeDeclarationExportHoist = (node) => {
  if (node.type === "VariableDeclaration") {
    return map(
      flatMap(node.declarations, listDeclaratorVariable),
      makeSelfExportHoist,
    );
  } else if (
    node.type === "ClassDeclaration" ||
    node.type === "FunctionDeclaration"
  ) {
    if (node.id == null) {
      return [];
    } else {
      return [
        makeSelfExportHoist(
          /** @type {import("../../estree").Variable} */ (node.id.name),
        ),
      ];
    }
  } else {
    throw new AranTypeError(node);
  }
};

/**
 * @type {(
 *   node: (
 *     | import("../../estree").ImportDefaultSpecifier
 *     | import("../../estree").ImportSpecifier
 *     | import("../../estree").ImportNamespaceSpecifier
 *   ),
 * ) => import("../../estree").Specifier | null}
 */
const getImportSpecifier = (node) => {
  if (node.type === "ImportDefaultSpecifier") {
    return DEFAULT_SPECIFIER;
  } else if (node.type === "ImportSpecifier") {
    return getSpecifier(node.imported);
  } else if (node.type === "ImportNamespaceSpecifier") {
    return null;
  } else {
    throw new AranTypeError(node);
  }
};

/**
 * @type {(
 *   node: import("../../estree").Node,
 * ) => import("../../header").ModuleHeader[]}
 */
const listModuleHeaderNode = (node) => {
  if (node.type === "ExportNamedDeclaration") {
    const source = node.source == null ? null : getSource(node.source);
    if (source == null) {
      return [
        ...(node.declaration != null
          ? makeDeclarationExportHoist(node.declaration)
          : []),
        ...map(node.specifiers, makeSpecifierExportHeader),
      ];
    } else {
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
          type: "aggregate",
          mode: "strict",
          source,
          import: getSpecifier(specifier.local),
          export: getSpecifier(specifier.exported),
        }));
      }
    }
  } else if (node.type === "ExportDefaultDeclaration") {
    return [DEFAULT_EXPORT_HEADER];
  } else if (node.type === "ExportAllDeclaration") {
    return [
      {
        type: "aggregate",
        mode: "strict",
        source: getSource(node.source),
        import: null,
        export: node.exported == null ? null : getSpecifier(node.exported),
      },
    ];
  } else if (node.type === "ImportDeclaration") {
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
      return map(node.specifiers, (declaration) => ({
        type: "import",
        mode: "strict",
        source,
        import: getImportSpecifier(declaration),
      }));
    }
  } else {
    return [];
  }
};

/**
 * @type {(
 *   root: import("../../estree").Program,
 * ) => import("../../header").ModuleHeader[]}
 */
export const listModuleHeader = (node) => {
  switch (node.sourceType) {
    case "module": {
      return flatMap(node.body, listModuleHeaderNode);
    }
    case "script": {
      return EMPTY;
    }
    default: {
      throw new AranTypeError(node.sourceType);
    }
  }
};
