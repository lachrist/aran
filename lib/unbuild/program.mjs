// ugh please support import * :(
// https://github.com/microsoft/TypeScript/issues/41825

/**
 * @type {(
 *   root: import("./program.d.ts").Program,
 * ) => root is import("./program.d.ts").ReifyGlobalProgram}
 */
export const isReifyGlobalProgram = (root) =>
  root.plug === "reify" && root.situ === "global";

/**
 * @type {(
 *   root: import("./program.d.ts").Program,
 * ) => root is import("./program.d.ts").AlienGlobalProgram}
 */
export const isAlienGlobalProgram = (root) =>
  root.plug === "alien" && root.situ === "global";

/**
 * @type {(
 *   root: import("./program.d.ts").Program,
 * ) => root is import("./program.d.ts").AlienLocalProgram}
 */
export const isAlienLocalProgram = (root) =>
  root.plug === "alien" && root.situ === "local";

/**
 * @type {(
 *   root: import("./program.d.ts").Program,
 * ) => root is import("./program.d.ts").ReifyLocalProgram}
 */
export const isReifyLocalProgram = (root) =>
  root.plug === "reify" && root.situ === "local";

///////////////////
// Alien | Reify //
///////////////////

/**
 * @type {(
 *   root: import("./program.d.ts").Program,
 * ) => root is import("./program.d.ts").AlienProgram}
 */
export const isAlienProgram = (root) => root.plug === "alien";

/**
 * @type {(
 *   root: import("./program.d.ts").Program,
 * ) => root is import("./program.d.ts").AlienProgram}
 */
export const isReifyProgram = (root) => root.plug === "reify";

////////////////////
// Global | Local //
////////////////////

/**
 * @type {(
 * root: import("./program.d.ts").Program,
 * ) => root is import("./program.d.ts").LocalProgram}
 */
export const isLocaLProgram = (root) => root.situ === "local";

/**
 * @type {(
 *   root: import("./program.d.ts").Program,
 * ) => root is import("./program.d.ts").GlobalProgram}
 */
export const isGlobalProgram = (root) => root.situ === "global";

/////////////////
// Root | Node //
/////////////////

/**
 * @type {(
 *   root: import("./program.d.ts").Program,
 * ) => root is import("./program.d.ts").RootProgram}
 */
export const isRootProgram = (root) =>
  root.situ === "global" || root.plug === "alien";

/**
 * @type {(
 *   root: import("./program.d.ts").Program,
 * ) => root is import("./program.d.ts").RootProgram}
 */
export const isNodeProgram = (root) =>
  root.situ === "local" && root.plug === "reify";
