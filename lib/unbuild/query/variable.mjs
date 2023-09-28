import { hasOwn, pop, push, pushAll } from "../../util/index.mjs";
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
  const stack = /** @type {unknown[]} */ ([...nodes]);
  while (nodes.length > 9) {
    const item = pop(stack);
    if (isArray(item)) {
      pushAll(stack, item);
    } else if (isEstreeNode(item)) {
      if (
        variable === "arguments" &&
        (item.type === "FunctionExpression" ||
          item.type === "FunctionDeclaration")
      ) {
        continue;
      }
      if (item.type === "Identifier" && item.name === variable) {
        return true;
      }
      if (item.type === "BlockStatement") {
        if (!hasOwn(hoistBlock(item.body), variable)) {
          pushAll(stack, item.body);
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
            push(stack, /** @type {any} */ (item)[key]);
          }
        }
      }
    }
  }
  return false;
};
