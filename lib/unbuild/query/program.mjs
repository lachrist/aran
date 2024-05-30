import { AranTypeError } from "../../error.mjs";
import { listChild } from "./child.mjs";

/**
 * @type {(
 *   node: import("../../estree").Program,
 * ) => node is import("../../estree").ScriptProgram}
 */
export const isScriptProgram = (node) => node.sourceType === "script";

/**
 * @type {(
 *   node: import("../../estree").Program,
 * ) => node is import("../../estree").ModuleProgram}
 */
export const isModuleProgram = (node) => node.sourceType === "module";

/* eslint-disable local/no-impure */
/**
 * @type {(
 *   root: import("../../estree").Program
 * ) => null | string}
 */
export const checkModuleDeclaration = (root) => {
  /** @type {import("../../estree").Node[]} */
  const stack = [];
  let length = 0;
  if (root.sourceType === "module") {
    for (const child of root.body) {
      for (const grand_child of listChild(child)) {
        stack[length] = grand_child;
        length += 1;
      }
    }
  } else if (root.sourceType === "script") {
    for (const child of root.body) {
      stack[length] = child;
      length += 1;
    }
  } else {
    throw new AranTypeError(root.sourceType);
  }
  while (length > 0) {
    length -= 1;
    const node = stack[length];
    const { type } = node;
    if (
      type === "ImportDeclaration" ||
      type === "ExportNamedDeclaration" ||
      type === "ExportDefaultDeclaration" ||
      type === "ExportAllDeclaration"
    ) {
      if (node.loc == null) {
        return `Illegal module declaration ${type}`;
      } else {
        return `Illegal module declaration ${type} at ${node.loc.start.line}:${node.loc.start.column}`;
      }
    }
    for (const child of listChild(node)) {
      stack[length] = child;
      length += 1;
    }
  }
  return null;
};
/* eslint-enable local/no-impure */
