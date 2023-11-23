import { listSetupNewTargetEffect } from "./new-target.mjs";
import { listSetupThisEffect } from "./this.mjs";

export { makeReadNewTargetExpression } from "./new-target.mjs";
export { makeReadThisExpression } from "./this.mjs";
export {
  makeGetSuperExpression,
  makeSetSuperExpression,
  listSetSuperEffect,
} from "./super-access.mjs";
export { listCallSuperEffect, makeCallSuperExpression } from "./super-call.mjs";
export { makeReadFunctionArgumentsExpression } from "./function-arguments.mjs";
export { makeReturnArgumentExpression } from "./return.mjs";

/**
 * @typedef {import("./closure.d.ts").Closure} Closure
 */

/**
 * @typedef {import("../../cache.mjs").Cache} Cache
 */

/**
 * @type {(
 *   site: {
 *     path: unbuild.Path,
 *     meta: unbuild.Meta,
 *   },
 *   context: {
 *     mode: "strict" | "sloppy",
 *     root: {
 *       situ: "global" | "local",
 *     },
 *     closure: Closure,
 *   },
 * ) => aran.Effect<unbuild.Atom>[]}
 */
export const listSetupClosureEffect = ({ path, meta }, context) => [
  ...listSetupNewTargetEffect({ path }, context),
  ...listSetupThisEffect({ path, meta }, context),
];

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
