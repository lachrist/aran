/**
 * @type {(
 *   tell: import("./tell").Tell,
 * ) => tell is import("./tell").ContextTell}
 */
export const isContextTell = (tell) => tell.type === "context";

/**
 * @type {(
 *   tell: import("./tell").Tell,
 * ) => tell is import("./tell").DeclarationTell}
 */
export const isDeclarationTell = (tell) => tell.type === "declaration";

/**
 * @type {(
 *   tell: import("./tell").Tell,
 * ) => tell is import("./tell").LogTell}
 */
export const isLogTell = (tell) => tell.type === "log";

/**
 * @type {(
 *   tell: import("./tell").Tell,
 * ) => tell is import("./tell").HeaderTell}
 */
export const isHeaderTell = (tell) => tell.type === "header";
