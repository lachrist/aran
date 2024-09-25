import { EMPTY, hasOwn } from "../../util/index.mjs";
import { annotateCompletion } from "./completion.mjs";
import { annotateHoisting } from "./hoisting.mjs";

/**
 * @type {(
 *   root: import("../../estree").Program,
 *   kind: "module" | "eval" | "script",
 *   mode: "strict" | "sloppy",
 *   digest: import("../../hash").Digest,
 * ) => {
 *   report: import("./hoisting-public").Error[],
 *   unbound: import("./hoisting-public").Binding[],
 *   annotation: import(".").Annotation,
 * }}
 */
export const annotate = (root, kind, mode, digest) => {
  const { report, unbound, hoisting } = annotateHoisting(
    root,
    kind,
    mode,
    digest,
  );
  return {
    report,
    unbound,
    annotation: {
      completion: annotateCompletion(root, digest),
      hoisting,
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
 * ) => import("./hoisting-public").Binding[]}
 */
export const hoist = (hash, { hoisting }) =>
  hasOwn(hoisting, hash) ? hoisting[hash] : EMPTY;
