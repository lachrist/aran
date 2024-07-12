import { AranTypeError } from "../error.mjs";
import { flatMap } from "../util/index.mjs";
import { mangleImport, mangleExport, mangleSpecifier } from "./mangle.mjs";

/**
 * @type {(
 *   header: import("../header").ModuleHeader,
 *   config: import("./config").Config,
 * ) => (import("../estree").ModuleDeclaration | import("../estree").Statement)[]}
 */
const rebuildModuleHeader = (header, config) => {
  switch (header.type) {
    case "import": {
      return [
        {
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
          source: {
            type: "Literal",
            value: header.source,
          },
        },
      ];
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
            },
          ],
        },
        {
          type: "ExportNamedDeclaration",
          declaration: null,
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
        return [
          {
            type: "ExportAllDeclaration",
            exported:
              header.export === null ? null : mangleSpecifier(header.export),
            source: {
              type: "Literal",
              value: header.source,
            },
          },
        ];
      } else {
        return [
          {
            type: "ExportNamedDeclaration",
            declaration: null,
            specifiers: [
              {
                type: "ExportSpecifier",
                local: mangleSpecifier(header.import),
                exported: mangleSpecifier(header.export),
              },
            ],
            source: {
              type: "Literal",
              value: header.source,
            },
          },
        ];
      }
    }
    default: {
      throw new AranTypeError(header);
    }
  }
};

/**
 * @type {(
 *   head: import("../header").ModuleHeader[],
 *   config: import("./config").Config,
 * ) => (
 *   | import("../estree").ModuleDeclaration
 *   | import("../estree").Statement
 * )[]}
 */
export const listModuleDeclaration = (head, config) =>
  flatMap(head, (node) => rebuildModuleHeader(node, config));
