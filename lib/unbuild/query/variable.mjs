/* eslint-disable local/no-impure */
import { hasOwn } from "../../util/index.mjs";
import { hoistBlock } from "./hoist.mjs";

const {
  Array: { isArray },
  Reflect: { ownKeys: listKey },
} = globalThis;

/** @type {(unknown: unknown) => unknown is estree.Node} */
const isEstreeNode = (unknown) =>
  typeof unknown === "object" && unknown !== null && hasOwn(unknown, "type");

/** @type {(nodes: estree.Node[], variable: estree.Variable) => boolean} */
export const hasFreeVariable = (nodes, variable) => {
  /** @type {unknown[]} */
  const stack = [...nodes];
  let todo = stack.length;
  while (todo > 0) {
    todo -= 1;
    const item = stack[todo];
    if (isArray(item)) {
      for (const child of item) {
        stack[todo] = child;
        todo += 1;
      }
    } else if (isEstreeNode(item)) {
      if (
        variable !== "arguments" ||
        (item.type !== "FunctionExpression" &&
          item.type !== "FunctionDeclaration")
      ) {
        if (item.type === "Identifier" && item.name === variable) {
          return true;
        }
        if (item.type === "BlockStatement") {
          if (!hasOwn(hoistBlock(item.body), variable)) {
            for (const child of item.body) {
              stack[todo] = child;
              todo += 1;
            }
          }
        } else {
          for (const key of listKey(item)) {
            if (
              key !== "leadingComments" &&
              key !== "trailingComments" &&
              key !== "loc" &&
              key !== "range" &&
              key !== "start" &&
              key !== "end"
            ) {
              stack[todo] = /** @type {any} */ (item)[key];
              todo += 1;
            }
          }
        }
      }
    }
  }
  return false;
};
