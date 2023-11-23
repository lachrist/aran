import { flatMap, map } from "../../util/index.mjs";
import { AranTypeError } from "../../error.mjs";
import { getSpecifier } from "./specifier.mjs";

const {
  Object: { fromEntries: reduceEntry },
} = globalThis;

/**
 * @type {(
 *   node:
 *     | estree.ImportDefaultSpecifier
 *     | estree.ImportSpecifier
 *     | estree.ImportNamespaceSpecifier
 * ) => estree.Specifier | null}
 */
const extractImportSpecifier = (node) => {
  if (node.type === "ImportDefaultSpecifier") {
    return /** @type {estree.Specifier} */ ("default");
  } else if (node.type === "ImportNamespaceSpecifier") {
    return null;
  } else if (node.type === "ImportSpecifier") {
    return getSpecifier(node.imported);
  } /* c8 ignore start */ else {
    throw new AranTypeError("invalid import specifier estree node", node);
  } /* c8 ignore stop */
};

/**
 * @type {(
 *   node: estree.Node,
 * ) => [string, {source: estree.Source, specifier: estree.Specifier | null}][]}
 */
const hoistImportEntry = (node) => {
  if (node.type === "ImportDeclaration") {
    return map(node.specifiers, (specifier) => [
      specifier.local.name,
      {
        source: /** @type {estree.Source} */ (node.source.value),
        specifier: extractImportSpecifier(specifier),
      },
    ]);
  } else {
    return [];
  }
};

/**
 * @type {(
 *   node: estree.Node[],
 * ) => Record<string, {source: estree.Source, specifier: estree.Specifier | null}>}
 */
export const hoistImport = (nodes) =>
  reduceEntry(flatMap(nodes, hoistImportEntry));
