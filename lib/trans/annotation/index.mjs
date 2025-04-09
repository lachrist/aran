import { EMPTY, hasOwn, listEntry } from "../../util/index.mjs";
import { annotateCompletion } from "./completion.mjs";
import { annotateHoisting } from "./hoisting.mjs";

export { makeSloppyFunctionFakeHash } from "./hoisting.mjs";

/**
 * @type {(
 *   root: import("estree-sentry").Program<import("../hash.d.ts").HashProp>,
 *   kind: "module" | "eval" | "script",
 *   mode: "strict" | "sloppy",
 * ) => {
 *   report: import("./hoisting.d.ts").Error[],
 *   unbound: import("./hoisting.d.ts").FrameEntry[],
 *   annotation: import("./index.d.ts").Annotation,
 * }}
 */
export const annotate = (root, kind, mode) => {
  const { report, unbound, hoisting } = annotateHoisting(root, kind, mode);
  const completion = annotateCompletion(root);
  return { report, unbound, annotation: { hoisting, completion } };
};

/**
 * @type {(
 *   hash: import("../hash.d.ts").Hash,
 *   annotation: import("./index.d.ts").Annotation,
 * ) => boolean}
 */
export const isCompletion = (hash, { completion }) => hasOwn(completion, hash);

/**
 * @type {(
 *   hash: import("../hash.d.ts").Hash,
 *   annotation: import("./index.d.ts").Annotation,
 * ) => import("./hoisting.d.ts").FrameEntry[]}
 */
export const hoist = (hash, { hoisting }) =>
  hasOwn(hoisting, hash) ? listEntry(hoisting[hash]) : EMPTY;
