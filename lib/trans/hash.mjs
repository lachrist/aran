import { listChildren } from "estree-sentry";

/* eslint-disable local/no-impure */
/**
 * @type {(
 *   root: import("estree-sentry").Program<import("./hash.d.ts").HashProp>,
 *   hash: import("./hash.d.ts").Hash,
 * ) => import("estree-sentry").Node<import("./hash.d.ts").HashProp> | null}
 */
export const retrieve = (root, hash) => {
  /** @type {import("estree-sentry").Node<import("./hash.d.ts").HashProp>[]} */
  const todo = [root];
  let length = 1;
  while (length > 0) {
    const node = todo[--length];
    if (node._hash === hash) {
      return node;
    }
    for (const child of listChildren(root)) {
      todo[length++] = child;
    }
  }
  return null;
};
/* eslint-enable local/no-impure */
