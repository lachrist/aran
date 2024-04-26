import { AranTypeError } from "../../error.mjs";

export const DEFAULT_SPECIFIER = /** @type {estree.Specifier & "default"} */ (
  "default"
);

/**
 * @type {(
 *   variable: estree.Variable,
 * ) => estree.Specifier}
 */
export const selfSpecifier = (variable) =>
  /** @type {estree.Specifier} */ (/** @type {string} */ (variable));

/**
 * @type {(
 *   node: estree.Identifier | estree.SimpleLiteral & { value: string },
 * ) => estree.Specifier}
 */
export const getSpecifier = (node) => {
  switch (node.type) {
    case "Identifier": {
      return /** @type {estree.Specifier} */ (node.name);
    }
    case "Literal": {
      switch (typeof node.value) {
        case "string": {
          return /** @type {estree.Specifier} */ (node.value);
        }
        default: {
          throw new AranTypeError(node.value);
        }
      }
    }
    default: {
      throw new AranTypeError(node);
    }
  }
};

/**
 * @type {(
 *   node: (
 *     | estree.ImportSpecifier
 *     | estree.ImportDefaultSpecifier
 *     | estree.ImportNamespaceSpecifier
 *   ),
 * ) => estree.Specifier | null}
 */
export const getImportSpecifier = (node) => {
  switch (node.type) {
    case "ImportDefaultSpecifier": {
      return DEFAULT_SPECIFIER;
    }
    case "ImportNamespaceSpecifier": {
      return null;
    }
    case "ImportSpecifier": {
      return getSpecifier(node.imported);
    }
    default: {
      throw new AranTypeError(node);
    }
  }
};
