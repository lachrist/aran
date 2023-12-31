import { map } from "../../util/index.mjs";
import { AranTypeError } from "../../error.mjs";
import { getSpecifier } from "./specifier.mjs";

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
 * ) => [
 *   estree.Variable,
 *   {
 *     kind: "import",
 *     source: estree.Source,
 *     specifier: estree.Specifier | null,
 *   },
 * ][]}
 */
export const hoistImport = (node) => {
  if (node.type === "ImportDeclaration") {
    return map(node.specifiers, (specifier) => [
      /** @type {estree.Variable} */ (specifier.local.name),
      {
        kind: "import",
        source: /** @type {estree.Source} */ (node.source.value),
        specifier: extractImportSpecifier(specifier),
      },
    ]);
  } else {
    return [];
  }
};
