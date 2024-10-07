import { EMPTY, hasOwn } from "../../util/index.mjs";
import { annotateCompletion } from "./completion.mjs";
import { annotateDeadzone } from "./deadzone.mjs";
import { annotateHoisting } from "./hoisting.mjs";

export { makeSloppyFunctionFakeHash } from "./hoisting.mjs";

/**
 * @type {(
 *   root: import("estree-sentry").Program<import("../../hash").HashProp>,
 *   kind: "module" | "eval" | "script",
 *   mode: "strict" | "sloppy",
 * ) => {
 *   report: import("./hoisting").Error[],
 *   unbound: import("./hoisting").Binding[],
 *   annotation: import(".").Annotation,
 * }}
 */
export const annotate = (root, kind, mode) => {
  const { report, unbound, hoisting } = annotateHoisting(root, kind, mode);
  return {
    report,
    unbound,
    annotation: {
      hoisting,
      deadzone: annotateDeadzone(root, hoisting),
      completion: annotateCompletion(root),
    },
  };
};

/**
 * @type {(
 *   hash: import("../../hash").Hash,
 *   annotation: import(".").Annotation,
 * ) => boolean}
 */
export const isCompletion = (hash, { completion }) => hasOwn(completion, hash);

/**
 * @type {(
 *   hash: import("../../hash").Hash,
 *   annotation: import(".").Annotation,
 * ) => import("./hoisting").Binding[]}
 */
export const hoist = (hash, { hoisting }) =>
  hasOwn(hoisting, hash) ? hoisting[hash] : EMPTY;

/**
 * @type {(
 *   hash: import("../../hash").Hash,
 *   annotation: import(".").Annotation,
 * ) => import("./deadzone").Zone}
 */
export const getDeadzoneStatus = (hash, { deadzone }) =>
  hasOwn(deadzone, hash) ? deadzone[hash] : "schrodinger";
