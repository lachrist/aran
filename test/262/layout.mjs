const { URL } = globalThis;

export const ROOT = new URL("../../", import.meta.url);

export const TEST262 = new URL("test/262/test262/", ROOT);

export const HARNESS = new URL("harness/", TEST262);

/**
 * @type {(
 *   name: import("./fetch").HarnessName,
 * ) => URL}
 */
export const locateHarness = (name) => new URL(`${name}.js`, HARNESS);
