import { primeAt } from "../util/index.mjs";

/** @type {import("./meta").Meta} */
export const ROOT_META = {
  prime_index: 0,
  product: 1n,
};

/**
 * @type {(
 *   meta: import("./meta").Meta,
 * ) => import("./meta").Meta}
 */
export const nextMeta = ({ prime_index, product }) => ({
  prime_index,
  product: product * primeAt(prime_index),
});

/**
 * @type {(
 *   meta: import("./meta").Meta,
 * ) => import("./meta").Meta}
 */
export const forkMeta = ({ prime_index, product }) => ({
  prime_index: prime_index + 1,
  product,
});
