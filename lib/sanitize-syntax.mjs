import { AranSyntaxError } from "./report.mjs";
import { hasNarrowObject } from "./util/index.mjs";

const {
  Array: { isArray },
  Reflect: { ownKeys: listKey },
} = globalThis;

/**
 * @type {(
 *   node: unknown,
 * ) => node is { type: string }}
 */
const isNode = (node) =>
  typeof node === "object" &&
  node !== null &&
  hasNarrowObject(node, "type") &&
  typeof node.type === "string";

/* eslint-disable local/no-impure */
/**
 * @type {(
 *   node: unknown,
 *   path: string,
 * ) => void}
 */
export const checkModuleDeclaration = (node, path) => {
  if (isArray(node)) {
    const { length } = node;
    for (let index = 0; index < length; index += 1) {
      checkModuleDeclaration(node[index], `${path}.${index}`);
    }
  } else {
    if (isNode(node)) {
      const { type } = node;
      if (
        type === "ImportDeclaration" ||
        type === "ExportNamedDeclaration" ||
        type === "ExportDefaultDeclaration" ||
        type === "ExportAllDeclaration"
      ) {
        throw new AranSyntaxError({
          node,
          path,
          message: `Illegal module declaration ${type}`,
        });
      }
      for (const key of listKey(node)) {
        if (typeof key === "string" && key !== "type" && key !== "loc") {
          checkModuleDeclaration(
            /** @type {any} */ (node)[key],
            `${path}.${key}`,
          );
        }
      }
    }
  }
};
/* eslint-enable local/no-impure */

/**
 * @type {(
 *   node: unknown,
 *   path: string,
 * ) => import("./estree").Program}
 */
export const sanitizeSyntax = (node, path) => {
  if (isNode(node) && node.type === "Program") {
    // eslint-disable-next-line local/no-impure
    checkModuleDeclaration(node, path);
    return /** @type {any} */ (node);
  } else {
    throw new AranSyntaxError({
      node,
      path,
      message: "Not a Program node",
    });
  }
};
