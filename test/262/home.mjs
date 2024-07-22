const { URL } = globalThis;

export const root = new URL("../../", import.meta.url);

export const home = new URL("test/262/test262/", root);

/**
 * @type {(
 *   url: URL,
 * ) => string}
 */
export const toTarget = (url) => url.href.substring(home.href.length);

/**
 * @type {(
 *   target: string
 * ) => string}
 */
export const toRelative = (target) => `test/262/test262/${target}`;
