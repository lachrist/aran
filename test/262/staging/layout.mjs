const { URL } = globalThis;

/**
 * @type {(
 *   base: "spec" | "fail" | "prod",
 * ) => (
 *   name: import("./stage-name").StageName,
 * ) => URL}
 */
const compile = (base) => (name) => new URL(`${base}/${name}.jsonl`, base);

export const toProd = compile("prod");

export const toSpec = compile("spec");

export const toFail = compile("fail");
