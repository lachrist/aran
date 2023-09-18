import {
  map,
  flatMap,
  hasOwn,
  includes,
  StaticError,
  DynamicError,
} from "../util/index.mjs";
import { listDeclaratorVariable } from "./hoist.mjs";

const {
  Reflect: { defineProperty },
} = globalThis;

/** @type {(variable: estree.Variable) => [estree.Variable, estree.Specifier]} */
const exportSelf = (variable) => [
  variable,
  /** @type {estree.Specifier} */ (/** @type {string} */ (variable)),
];

/** @type {(node: estree.ExportSpecifier) => [estree.Variable, estree.Specifier]}*/
const pairExport = (node) => [
  /** @type {estree.Variable} */ (node.local.name),
  /** @type {estree.Specifier} */ (node.exported.name),
];

/** @type {(node: estree.Node) => [estree.Variable, estree.Specifier][]} */
const hoistExportEntry = (node) => {
  if (node.type === "ExportNamedDeclaration") {
    if (node.declaration != null) {
      if (node.declaration.type === "VariableDeclaration") {
        return map(
          flatMap(node.declaration.declarations, listDeclaratorVariable),
          exportSelf,
        );
      } else if (
        node.declaration.type === "FunctionDeclaration" ||
        node.declaration.type === "ClassDeclaration"
      ) {
        /* c8 ignore start */ if (node.declaration.id === null) {
          throw new DynamicError(
            "declaration id can only be missing in export default",
            node.declaration,
          );
        } /* c8 ignore stop */ else {
          return [
            exportSelf(
              /** @type {estree.Variable} */ (node.declaration.id.name),
            ),
          ];
        }
      } /* c8 ignore start */ else {
        throw new StaticError("invalid declaration node", node.declaration);
      } /* c8 ignore stop */
    } else if (node.source != null) {
      return [];
    } else {
      return map(node.specifiers, pairExport);
    }
  } else if (node.type === "ExportDefaultDeclaration") {
    return [];
  } else {
    return [];
  }
};

/** @type {(nodes: estree.Node[]) => Record<estree.Variable, estree.Specifier[]>} */
export const hoistExport = (nodes) => {
  const mapping =
    /** @type {Record<estree.Variable, estree.Specifier[]>} */ ({});
  const entries = flatMap(nodes, hoistExportEntry);
  const { length } = entries;
  for (let index = 0; index < length; index += 1) {
    const [variable, specifier] = entries[index];
    if (hasOwn(mapping, variable)) {
      const specifiers = mapping[variable];
      if (!includes(specifiers, specifier)) {
        specifiers[specifiers.length] = specifier;
      }
    } else {
      defineProperty(mapping, variable, {
        writable: true,
        enumerable: true,
        configurable: true,
        value: [specifier],
      });
    }
  }
  return mapping;
};
