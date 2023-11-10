export * from "./catch-error.mjs";
export * from "./closure.mjs";
export * from "./enclave.mjs";
export * from "./function-arguments.mjs";
export * from "./import-meta.mjs";
export * from "./import.mjs";
export * from "./private.mjs";
export * from "./super.mjs";

/**
 * @typedef {import("../cache.mjs").Cache} Cache
 */

/**
 * @typedef {import("./param.d.ts").Param} Param
 */

/**
 * @type {(
 *   kind: "module" | "script" | "eval",
 *   situ: "local" | "global",
 * ) => Param}
 */
export const makeRootParam = (program, situ) => ({
  program,
  situ,
  catch: false,
  privates: {},
  arrow: "none",
  function: { type: "none" },
});

/**
 * @type {(
 *   param: Param,
 *   privates: { [k in estree.PrivateKey]: Cache },
 * ) => Param}
 */
export const extendParamPrivate = (param, privates) => ({
  ...param,
  privates: {
    ...param.privates,
    ...privates,
  },
});

/**
 * @type {(
 *   param: Param,
 *   closure: {
 *     type: "arrow",
 *   } | {
 *     type: "function",
 *   } | {
 *     type: "method",
 *     proto: Cache,
 *   } | {
 *     type: "constructor",
 *     self: Cache,
 *     super: Cache | null,
 *     field: Cache | null,
 *   }
 * ) => Param}
 */
export const extendParamClosure = (param, closure) =>
  closure.type === "arrow"
    ? { ...param, arrow: "arrow" }
    : { ...param, arrow: "none", function: closure };

/**
 * @type {(param: Param) => Param}
 */
export const extendParamCatch = (param) => ({
  ...param,
  catch: true,
});

/**
 * @type {(param: Param) => Param}
 */
export const extendParamEval = (param) => ({
  ...param,
  arrow: "eval",
});
