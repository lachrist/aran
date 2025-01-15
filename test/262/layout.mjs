const { URL } = globalThis;

export const root = new URL("../../", import.meta.url);

export const home = new URL("test/262/test262/", root);

export const HARNESS = new URL("harness/", home);

/**
 * @type {(
 *   name: import("./fetch").HarnessName,
 * ) => URL}
 */
export const locateHarness = (name) => new URL(`${name}.js`, HARNESS);
