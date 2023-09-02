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

/** @type {(variable: Variable) => [Variable, Specifier]} */
const exportSelf = (variable) => [
  variable,
  /** @type {Specifier} */ (/** @type {string} */ (variable)),
];

/** @type {(node: EstreeExportSpecifier) => [Variable, Specifier]}*/
const pairExport = (node) => [
  /** @type {Variable} */ (node.local.name),
  /** @type {Specifier} */ (node.exported.name),
];

/** @type {(node: EstreeNode) => [Variable, Specifier][]} */
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
        if (node.declaration.id == null) {
          throw new DynamicError(
            "declaration id can only be missing in export default",
            node.declaration,
          );
        } else {
          return [
            exportSelf(/** @type {Variable} */ (node.declaration.id.name)),
          ];
        }
      } else {
        throw new StaticError("invalid declaration node", node.declaration);
      }
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

/** @type {(nodes: EstreeNode[]) => Record<Variable, Specifier[]>} */
export const hoistExport = (nodes) => {
  const mapping = /** @type {Record<Variable, Specifier[]>} */ ({});
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