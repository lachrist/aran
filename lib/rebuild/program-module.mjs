import { AranTypeError } from "../error.mjs";
import { flatMap, map } from "../util/index.mjs";
import { mangleImport, mangleExport, mangleSpecifier } from "./mangle.mjs";

const {
  Array: { from: toArray },
  Reflect: { apply },
  JSON: { stringify: stringifyJSON },
  Map,
  Map: {
    prototype: { values: listMapValue },
  },
} = globalThis;

/**
 * @type {(
 *   header: import("../header").ModuleHeader
 * ) => string}
 */
const hashModuleHeader = (header) => {
  const {
    type,
    source,
    import: import_,
    export: export_,
  } = {
    source: null,
    import: null,
    export: null,
    ...header,
  };
  return stringifyJSON([type, source, import_, export_]);
};

/**
 * @type {(
 *   header: import("../header").ModuleHeader,
 * ) => [string, import("../header").ModuleHeader]}
 */
const makeModuleHeaderEntry = (header) => [hashModuleHeader(header), header];

/**
 * @type {(
 *   head: import("../header").ModuleHeader[],
 * ) => import("../header").ModuleHeader[]}
 */
const removeDuplicateModuleHeader = (head) =>
  toArray(apply(listMapValue, new Map(map(head, makeModuleHeaderEntry)), []));

/**
 * @type {(
 *   header: import("../header").ModuleHeader,
 *   config: import("./config").Config,
 * ) => (estree.ModuleDeclaration | estree.Statement)[]}
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
 * ) => (estree.ModuleDeclaration | estree.Statement)[]}
 */
export const listModuleDeclaration = (head, config) =>
  flatMap(removeDuplicateModuleHeader(head), (node) =>
    rebuildModuleHeader(node, config),
  );
