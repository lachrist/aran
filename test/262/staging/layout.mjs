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

export const locateStageProd = compile("prod", "jsonl");

export const locateStageSpec = compile("spec", "mjs");

export const locateStageFail = compile("fail", "txt");
