import { hasOwn } from "../util/index.mjs";

const {
  Array: { isArray },
  Reflect: { ownKeys: listKey },
} = globalThis;

export const LOG_KEY = "_ARAN_LOG_";

/* eslint-disable local/no-impure */
/**
 * @type {(node: unknown) => rebuild.Log[]}
 */
export const listLog = (node) => {
  /** @type {unknown[]} */
  const stack = [node];
  let todo = 1;
  const logs = [];
  let length = 0;
  while (todo > 1) {
    todo -= 1;
    const item = stack[todo];
    if (isArray(item)) {
      for (const child of item) {
        stack[todo] = child;
        todo += 1;
      }
    } else if (typeof item === "object" && item !== null) {
      if (hasOwn(item, "type")) {
        if (hasOwn(item, LOG_KEY)) {
          for (const log of /** @type {any} */ (item)[LOG_KEY]) {
            logs[length] = log;
            length += 1;
          }
        }
        for (const key of listKey(item)) {
          stack[todo] = /** @type {any} */ (item)[key];
          todo += 1;
        }
      }
    }
  }
  return logs;
};
/* eslint-enable local/no-impure */
