const { URL } = globalThis;

export const root = new URL("../../", import.meta.url);

export const home = new URL("test/262/test262/", root);
