import { flatMap, map } from "../util/index.mjs";

const {
  TypeError,
  Object: { fromEntries: reduceEntry },
} = globalThis;

/** @type {(node: EstreeUnionImportSpecifier) => Specifier | null}  */
export const extractImportSpecifier = (node) => {
  if (node.type === "ImportDefaultSpecifier") {
    return "default";
  } else if (node.type === "ImportNamespaceSpecifier") {
    return null;
  } else if (node.type === "ImportSpecifier") {
    return node.imported.name;
  } else {
    throw new TypeError("invalid specifier type");
  }
};

/** @type {(node: EstreeNode) => [Variable, {source: Source, specifier: Specifier | null}][]} */
const bindImport = (node) => {
  if (node.type === "ImportDeclaration") {
    return map(node.specifiers, (specifier) => [
      specifier.local.name,
      {
        source: /** @type {string} */ (node.source.value),
        specifier: extractImportSpecifier(specifier),
      },
    ]);
  } else {
    return [];
  }
};

/** @type {(node: EstreeProgram) => Record<Variable, {source:Source, specifier:Specifier | null}>} */
export const mapImport = (node) => reduceEntry(flatMap(node.body, bindImport));
