/**
 * @type {(
 *   meta: import("./enum.d.ts").Meta,
 *   base: import("./enum.d.ts").Base,
 *   version: 1 | 2,
 * ) => string}
 */
export const toBasePath = (meta, base, version) =>
  `test/bench/out/base-${meta.replaceAll("/", "-")}-${base}-${version}.mjs`;

/**
 * @type {(
 *   meta: import("./enum.d.ts").Meta,
 *   base: import("./enum.d.ts").Base,
 * ) => string}
 */
export const toMainPath = (meta, base) =>
  `test/bench/out/main-${meta.replaceAll("/", "-")}-${base}.mjs`;

/**
 * @type {(
 *   meta: import("./enum.d.ts").Meta,
 *   base: import("./enum.d.ts").Base,
 * ) => string}
 */
export const toDumpPath = (meta, base) =>
  `test/bench/out/dump-${meta.replaceAll("/", "-")}-${base}.json`;
