const { URL } = globalThis;

/**
 * @type {(
 *   base: "spec" | "fail" | "prod",
 *   ext: "mjs" | "jsonl" | "txt",
 * ) => (
 *   name: import("./stage-name").StageName,
 * ) => URL}
 */
const compile = (base, ext) => (name) =>
  new URL(`${base}/${name}.${ext}`, import.meta.url);

export const toProd = compile("prod", "jsonl");

export const toSpec = compile("spec", "mjs");

export const toFail = compile("fail", "txt");
