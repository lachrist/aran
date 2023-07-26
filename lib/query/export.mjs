import { map, flatMap, hasOwn, includes } from "../util/index.mjs";
import { listDeclaratorVariable } from "./hoist.mjs";

const {
  TypeError,
  Reflect: { defineProperty },
} = globalThis;

/** @type {<X>(x: X) => [X, X]} */
const pairSelf = (x) => [x, x];

/** @type {(node: EstreeExportSpecifier) => [Variable, Specifier]}*/
const pairExport = (node) => [node.local.name, node.exported.name];

/** @type {(node: EstreeNode) => [Variable, Specifier][]} */
const hoistExportEntry = (node) => {
  if (node.type === "ExportNamedDeclaration") {
    if (node.declaration != null) {
      if (node.declaration.type === "VariableDeclaration") {
        return map(
          flatMap(node.declaration.declarations, listDeclaratorVariable),
          pairSelf,
        );
      } else if (
        node.declaration.type === "FunctionDeclaration" ||
        node.declaration.type === "ClassDeclaration"
      ) {
        /* c8 ignore start */ if (node.declaration.id == null) {
          throw new SyntaxError("invalid declaration node");
        } /* c8 ignore stop */ else {
          return [pairSelf(node.declaration.id.name)];
        }
      } /* c8 ignore start */ else {
        throw new TypeError("invalid declaration node");
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
