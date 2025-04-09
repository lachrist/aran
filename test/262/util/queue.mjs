import { isNotEmptyArray, shift } from "./array.mjs";

const { Error, Promise, undefined } = globalThis;

/**
 * @type {<X>() => import("./queue.d.ts").Queue<X>}
 */
export const createQueue = () => ({
  done: false,
  buffer: [],
  pendings: [],
});

/**
 * @type {<X>(
 *   queue: import("./queue.d.ts").Queue<X>,
 * ) => void}
 */
export const closeQueue = (queue) => {
  queue.done = true;
  while (isNotEmptyArray(queue.pendings)) {
    const { resolve } = shift(queue.pendings);
    resolve({ done: true, value: undefined });
  }
};

/**
 * @type {<X>(
 *   queue: import("./queue.d.ts").Queue<X>,
 *   value: X,
 * ) => void}
 */
export const pushQueue = ({ done, pendings, buffer }, value) => {
  if (done) {
    throw new Error("Cannot push new item after calling stop");
  }
  if (isNotEmptyArray(pendings)) {
    const { resolve } = shift(pendings);
    resolve({ done: false, value });
  } else {
    buffer.push(value);
  }
};

/**
 * @type {<X>(
 *   queue: import("./queue.d.ts").Queue<X>,
 * ) => Promise<import("./queue.d.ts").Item<X>>}
 */
export const pullQueue = ({ done, pendings, buffer }) => {
  if (isNotEmptyArray(buffer)) {
    return Promise.resolve({ done: false, value: shift(buffer) });
  } else {
    if (done) {
      return Promise.resolve({ done: true, value: undefined });
    } else {
      return new Promise((resolve, reject) => {
        pendings.push({ resolve, reject });
      });
    }
  }
};
