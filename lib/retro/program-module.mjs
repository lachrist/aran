import { AranTypeError } from "../error.mjs";
import { makeSourceLiteral } from "./literal.mjs";
import { mangleImport, mangleExport, mangleSpecifier } from "./mangle.mjs";

/**
 * @type {(
 *   header: import("../lang/header.d.ts").ModuleHeader,
 *   config: import("./config-internal.d.ts").InternalConfig,
 * ) => import("../util/tree.d.ts").Tree<
 *   import("estree-sentry").ModuleStatement<{}>,
 * >}
 */
export const makeModuleDeclaration = (header, config) => {
  switch (header.type) {
    case "import": {
      return {
        type: "ImportDeclaration",
        specifiers: [
          header.import === null
            ? {
                type: "ImportNamespaceSpecifier",
                local: mangleImport(header.source, header.import, config),
              }
            : {
                type: "ImportSpecifier",
                local: mangleImport(header.source, header.import, config),
                imported: mangleSpecifier(header.import),
              },
        ],
        source: makeSourceLiteral(header.source),
      };
    }
    case "export": {
      return [
        {
          type: "VariableDeclaration",
          kind: "let",
          declarations: [
            {
              type: "VariableDeclarator",
              id: mangleExport(header.export, config),
              init: null,
            },
          ],
        },
        {
          type: "ExportNamedDeclaration",
          declaration: null,
          source: null,
          specifiers: [
            {
              type: "ExportSpecifier",
              local: mangleExport(header.export, config),
              exported: mangleSpecifier(header.export),
            },
          ],
        },
      ];
    }
    case "aggregate": {
      if (header.import === null) {
        return {
          type: "ExportAllDeclaration",
          exported:
            header.export === null ? null : mangleSpecifier(header.export),
          source: makeSourceLiteral(header.source),
        };
      } else {
        return {
          type: "ExportNamedDeclaration",
          declaration: null,
          specifiers: [
            {
              type: "ExportSpecifier",
              local: mangleSpecifier(header.import),
              exported: mangleSpecifier(header.export),
            },
          ],
          source: makeSourceLiteral(header.source),
        };
      }
    }
    default: {
      throw new AranTypeError(header);
    }
  }
};
