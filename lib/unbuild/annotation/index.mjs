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
      digest,
      completion: annotateCompletion(root, digest),
      hoisting,
    },
  };
};

/**
 * @type {(
 *   node: import("../../estree").Node,
 *   annotation: import(".").Annotation,
 * ) => import("../../hash").Hash}
 */
export const digest = (node, { digest }) => digest(node);

/**
 * @type {(
 *   node: import("../../estree").Node,
 *   annotation: import(".").Annotation,
 * ) => boolean}
 */
export const isCompletionNode = (node, { digest, completion }) =>
  hasOwn(completion, digest(node));

/**
 * @type {(
 *   node: import("../../estree").Node,
 *   annotation: import(".").Annotation,
 * ) => import("./hoisting-public").Binding[]}
 */
export const hoist = (node, { digest, hoisting }) => {
  const hash = digest(node);
  return hasOwn(hoisting, hash) ? hoisting[hash] : EMPTY;
};
