/**
 * @typedef {import("./context.d.ts").Root} Root
 * @typedef {import("./context.d.ts").AlienRoot} AlienRoot
 * @typedef {import("./context.d.ts").ReifyGlobalRoot} ReifyGlobalRoot
 * @typedef {import("./context.d.ts").AlienGlobalRoot} AlienGlobalRoot
 * @typedef {import("./context.d.ts").AlienLocalRoot} AlienLocalRoot
 */

/**
 * @type {(root: Root) => root is AlienRoot}
 */
export const isAlienRoot = (root) => root.plug === "alien";

/**
 * @type {(root: Root) => root is ReifyGlobalRoot}
 */
export const isReifyGlobalRoot = (root) =>
  root.plug === "reify" && root.situ === "global";

/**
 * @type {(root: Root) => root is AlienGlobalRoot}
 */
export const isAlienGlobalRoot = (root) =>
  root.plug === "alien" && root.situ === "global";

/**
 * @type {(root: Root) => root is AlienLocalRoot}
 */
export const isAlienLocalRoot = (root) =>
  root.plug === "alien" && root.situ === "local";
