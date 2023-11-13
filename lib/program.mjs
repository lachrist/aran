// ugh please support import * :(
// https://github.com/microsoft/TypeScript/issues/41825

/**
 * @typedef {import("./program.js").ReifyGlobalProgram} ReifyGlobalProgram
 * @typedef {import("./program.js").AlienGlobalProgram} AlienGlobalProgram
 * @typedef {import("./program.js").AlienLocalProgram} AlienLocalProgram
 * @typedef {import("./program.js").ReifyLocalProgram} ReifyLocalProgram
 * @typedef {import("./program.js").Program} Program
 * @typedef {import("./program.js").AlienProgram} AlienProgram
 * @typedef {import("./program.js").ReifyProgram} ReifyProgram
 * @typedef {import("./program.js").LocalProgram} LocalProgram
 * @typedef {import("./program.js").GlobalProgram} GlobalProgram
 * @typedef {import("./program.js").RootProgram} RootProgram
 * @typedef {import("./program.js").NodeProgram} NodeProgram
 */

/**
 * @type {(root: Program) => root is ReifyGlobalProgram}
 */
export const isReifyGlobalProgram = (root) =>
  root.plug === "reify" && root.situ === "global";

/**
 * @type {(root: Program) => root is AlienGlobalProgram}
 */
export const isAlienGlobalProgram = (root) =>
  root.plug === "alien" && root.situ === "global";

/**
 * @type {(root: Program) => root is AlienLocalProgram}
 */
export const isAlienLocalProgram = (root) =>
  root.plug === "alien" && root.situ === "local";

/**
 * @type {(root: Program) => root is ReifyLocalProgram}
 */
export const isReifyLocalProgram = (root) =>
  root.plug === "reify" && root.situ === "local";

///////////////////
// Alien | Reify //
///////////////////

/**
 * @type {(root: Program) => root is AlienProgram}
 */
export const isAlienProgram = (root) => root.plug === "alien";

/**
 * @type {(root: Program) => root is AlienProgram}
 */
export const isReifyProgram = (root) => root.plug === "reify";

////////////////////
// Global | Local //
////////////////////

/**
 * @type {(root: Program) => root is LocalProgram}
 */
export const isLocaLProgram = (root) => root.situ === "local";

/**
 * @type {(root: Program) => root is GlobalProgram}
 */
export const isGlobalProgram = (root) => root.situ === "global";

/////////////////
// Root | Node //
/////////////////

/**
 * @type {(root: Program) => root is RootProgram}
 */
export const isRootProgram = (root) =>
  root.situ === "global" || root.plug === "alien";

/**
 * @type {(root: Program) => root is RootProgram}
 */
export const isNodeProgram = (root) =>
  root.situ === "local" && root.plug === "reify";
