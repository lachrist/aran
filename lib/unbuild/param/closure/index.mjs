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
 * @type {(
 *   site: {
 *     path: unbuild.Path,
 *     meta: unbuild.Meta,
 *   },
 *   context: {
 *     mode: "strict" | "sloppy",
 *     situ: {
 *       kind: "script" | "module" | "eval",
 *       scope: "global" | "local",
 *     },
 *     closure: import("./closure").Closure,
 *   },
 * ) => aran.Effect<unbuild.Atom>[]}
 */
export const listSetupClosureEffect = ({ path, meta }, context) => [
  ...listSetupNewTargetEffect({ path }, context),
  ...listSetupThisEffect({ path, meta }, context),
];

/** @type {import("./closure").Closure} */
export const ROOT_CLOSURE = { type: "none", arrow: "none" };

/**
 * @type {(
 *   closure: import("./closure").Closure,
 *   frame: {
 *     type: "arrow",
 *   } | {
 *     type: "eval",
 *   } | {
 *     type: "function",
 *   } | {
 *     type: "method",
 *     proto: import("../../cache").Cache,
 *   } | {
 *     type: "constructor",
 *     derived: boolean,
 *     field: import("../../cache").Cache,
 *     self: import("../../cache").Cache,
 *   }
 * ) => import("./closure").Closure}
 */
export const extendClosure = (closure, frame) =>
  frame.type === "arrow" || frame.type === "eval"
    ? { ...closure, arrow: frame.type }
    : { ...frame, arrow: "none" };
