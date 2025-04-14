const { URL } = globalThis;

export const ROOT = new URL("../../", import.meta.url);

export const TEST262 = new URL("test262/", ROOT);

export const HARNESS = new URL("harness/", TEST262);
