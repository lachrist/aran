import { AranTypeError } from "../error.mjs";
import { flatMap, map } from "../util/index.mjs";
import { mangleImport, mangleExport } from "./mangle.mjs";

const {
  RegExp: {
    prototype: { test: testRegExp },
  },
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
 *   header: import("../header.js").ModuleHeader
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
 *   header: import("../header.js").ModuleHeader,
 * ) => [string, import("../header.js").ModuleHeader]}
 */
const makeModuleHeaderEntry = (header) => [hashModuleHeader(header), header];

/**
 * @type {(
 *   head: import("../header.js").ModuleHeader[],
 * ) => import("../header.js").ModuleHeader[]}
 */
const removeDuplicateModuleHeader = (head) =>
  toArray(apply(listMapValue, new Map(map(head, makeModuleHeaderEntry)), []));

const variable_regexp = /^(\p{ID_Start}|[$_])(\p{ID_Continue}|[$_])*$/u;

/**
 * @type {(
 *   specifier: estree.Specifier
 * ) => estree.Identifier}
 */
const makeSpecifier = (specifier) => {
  if (apply(testRegExp, variable_regexp, [specifier])) {
    return {
      type: "Identifier",
      name: specifier,
    };
  } else {
    return /** @type {any} */ ({
      type: "Literal",
      value: specifier,
    });
  }
};

/**
 * @type {(
 *   header: import("../header.js").ModuleHeader,
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
                  local: {
                    type: "Identifier",
                    name: mangleImport(
                      header.source,
                      header.import,
                      config.escape,
                    ),
                  },
                }
              : {
                  type: "ImportSpecifier",
                  local: {
                    type: "Identifier",
                    name: mangleImport(
                      header.source,
                      header.import,
                      config.escape,
                    ),
                  },
                  imported: makeSpecifier(header.import),
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
              id: {
                type: "Identifier",
                name: mangleExport(header.export, config.escape),
              },
            },
          ],
        },
        {
          type: "ExportNamedDeclaration",
          declaration: null,
          specifiers: [
            {
              type: "ExportSpecifier",
              local: {
                type: "Identifier",
                name: mangleExport(header.export, config.escape),
              },
              exported: makeSpecifier(header.export),
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
              header.export === null ? null : makeSpecifier(header.export),
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
                local: makeSpecifier(header.import),
                exported: makeSpecifier(header.export),
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
 *   head: import("../header.js").ModuleHeader[],
 *   config: import("./config").Config,
 * ) => (estree.ModuleDeclaration | estree.Statement)[]}
 */
export const listModuleDeclaration = (head, config) =>
  flatMap(removeDuplicateModuleHeader(head), (node) =>
    rebuildModuleHeader(node, config),
  );
