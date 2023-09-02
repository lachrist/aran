import { flatMap, map, StaticError } from "../util/index.mjs";

const {
  Object: { fromEntries: reduceEntry },
} = globalThis;

/** @type {(node: EstreeUnionImportSpecifier) => Specifier | null}  */
const extractImportSpecifier = (node) => {
  if (node.type === "ImportDefaultSpecifier") {
    return /** @type {Specifier} */ ("default");
  } else if (node.type === "ImportNamespaceSpecifier") {
    return null;
  } else if (node.type === "ImportSpecifier") {
    return /** @type {Specifier} */ (node.imported.name);
  } /* c8 ignore start */ else {
    throw new StaticError("invalid import specifier estree node", node);
  } /* c8 ignore stop */
};

/**
 * @type {(
 *   node: EstreeNode,
 * ) => [string, {source: Source, specifier: Specifier | null}][]}
 */
const hoistImportEntry = (node) => {
  if (node.type === "ImportDeclaration") {
    return map(node.specifiers, (specifier) => [
      specifier.local.name,
      {
        source: /** @type {Source} */ (node.source.value),
        specifier: extractImportSpecifier(specifier),
      },
    ]);
  } else {
    return [];
  }
};

/**
 * @type {(
 *   node: EstreeNode[],
 * ) => Record<string, {source: string, specifier: string | null}>}
 */
export const hoistImport = (nodes) =>
  reduceEntry(flatMap(nodes, hoistImportEntry));