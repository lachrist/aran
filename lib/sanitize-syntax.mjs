import { AranSyntaxError, AranTypeError } from "./report.mjs";
import { hasNarrowObject } from "./util/index.mjs";

const {
  Array: { isArray },
  Object: { entries: listEntry },
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
export const reportModuleDeclaration = (node, path) => {
  if (isArray(node)) {
    const { length } = node;
    for (let index = 0; index < length; index += 1) {
      reportModuleDeclaration(node[index], `${path}.${index}`);
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
      for (const [key, val] of listEntry(node)) {
        if (typeof key === "string" && key !== "type" && key !== "loc") {
          reportModuleDeclaration(val, `${path}.${key}`);
        }
      }
    }
  }
};
/* eslint-enable local/no-impure */

/* eslint-disable local/no-impure */
/**
 * @type {(
 *   node: unknown,
 *   path: string,
 * ) => void}
 */
export const sanitizeSyntax = (node, path) => {
  if (
    isNode(node) &&
    node.type === "Program" &&
    hasNarrowObject(node, "sourceType") &&
    (node.sourceType === "module" || node.sourceType === "script") &&
    hasNarrowObject(node, "body") &&
    isArray(node.body)
  ) {
    if (node.sourceType === "module") {
      const { length } = node.body;
      for (let index = 0; index < length; index += 1) {
        const child_node = node.body[index];
        const child_path = `${path}.body.${index}`;
        if (isNode(child_node)) {
          for (const [key, val] of listEntry(child_node)) {
            if (typeof key === "string" && key !== "type" && key !== "loc") {
              reportModuleDeclaration(val, `${child_path}.${key}`);
            }
          }
        }
      }
    } else if (node.sourceType === "script") {
      reportModuleDeclaration(node, path);
    } else {
      throw new AranTypeError(node.sourceType);
    }
  } else {
    throw new AranSyntaxError({
      node,
      path,
      message: "Not a Program node",
    });
  }
};
/* eslint-enable local/no-impure */
