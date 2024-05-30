import { AranTypeError } from "../../error.mjs";

export const DEFAULT_SPECIFIER =
  /** @type {import("../../estree").Specifier & "default"} */ ("default");

/**
 * @type {(
 *   variable: import("../../estree").Variable,
 * ) => import("../../estree").Specifier}
 */
export const selfSpecifier = (variable) =>
  /** @type {import("../../estree").Specifier} */ (
    /** @type {string} */ (variable)
  );

/**
 * @type {(
 *   node: import("../../estree").Identifier | import("../../estree").SimpleLiteral & { value: string },
 * ) => import("../../estree").Specifier}
 */
export const getSpecifier = (node) => {
  switch (node.type) {
    case "Identifier": {
      return /** @type {import("../../estree").Specifier} */ (node.name);
    }
    case "Literal": {
      switch (typeof node.value) {
        case "string": {
          return /** @type {import("../../estree").Specifier} */ (node.value);
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
 *     | import("../../estree").ImportSpecifier
 *     | import("../../estree").ImportDefaultSpecifier
 *     | import("../../estree").ImportNamespaceSpecifier
 *   ),
 * ) => import("../../estree").Specifier | null}
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
