const {
  Set,
  Set: {
    prototype: { has: hasSet, add: addSet },
  },
  Reflect: { apply },
  Array: { isArray, from: toArray },
  Object: { values: listValue },
} = globalThis;

/* eslint-disable local/no-impure */
/**
 * @type {(
 *   node: object,
 * ) => object[]}
 */
export const listAlias = (node) => {
  /** @type {Set<object>} */
  const aliases = new Set();
  /** @type {Set<object>} */
  const listing = new Set();
  /** @type {object[]} */
  const nodes = [node];
  let length = 1;
  while (length > 0) {
    length -= 1;
    const node = nodes[length];
    apply(addSet, apply(hasSet, listing, [node]) ? aliases : listing, [node]);
    for (const child of isArray(node) ? node : listValue(node)) {
      if (
        typeof child === "function" ||
        (typeof child === "object" && child !== null)
      ) {
        nodes[length] = child;
        length += 1;
      }
    }
  }
  return toArray(aliases);
};
/* eslint-enable local/no-impure */
