import { AranTypeError } from "../../error.mjs";

export const DEFAULT_SPECIFIER = /** @type {(estree.Specifier)} */ ("default");

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
