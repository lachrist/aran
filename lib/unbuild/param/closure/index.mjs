export * from "./super.mjs";
export * from "./other.mjs";
export * from "./function-arguments.mjs";

/**
 * @typedef {import("./closure.d.ts").Closure} Closure
 */

/**
 * @typedef {import("../../cache.mjs").Cache} Cache
 */

/** @type {Closure} */
export const ROOT_CLOSURE = { type: "none", arrow: "none" };

/**
 * @type {(
 *   closure: Closure,
 *   frame: {
 *     type: "arrow",
 *   } | {
 *     type: "eval",
 *   } | {
 *     type: "function",
 *   } | {
 *     type: "method",
 *     proto: Cache,
 *   } | {
 *     type: "constructor",
 *     derived: boolean,
 *     field: Cache,
 *     self: Cache,
 *   }
 * ) => Closure}
 */
export const extendClosure = (closure, frame) =>
  frame.type === "arrow" || frame.type === "eval"
    ? { ...closure, arrow: frame.type }
    : { ...frame, arrow: "none" };
