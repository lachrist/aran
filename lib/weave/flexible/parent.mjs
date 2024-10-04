import { AranTypeError } from "../../report.mjs";
import { listKey, map, reduceEntryTotal } from "../../util/index.mjs";
import { CLOSURE_KIND, SEGMENT_KIND } from "../parametrization.mjs";

/**
 * @type {(
 *   parent: import("./parent").Parent,
 * ) => null | import("./parent").ProgramParent}
 */
export const toProgramParent = (parent) => {
  if (parent.type === "program") {
    return parent;
  } else if (parent.type === "closure" || parent.type === "segment") {
    return null;
  } else {
    throw new AranTypeError(parent);
  }
};

/**
 * @type {(
 *   kind: import("../parametrization").SegmentKind
 * ) => [
 *   import("../parametrization").SegmentKind,
 *   import("./parent").SegmentParent,
 * ]}
 */
const makeControlEntry = (kind) => [kind, { type: "segment", kind }];

/**
 * @type {{
 *   [kind in import("../parametrization").SegmentKind]
 *     : import("./parent").SegmentParent
 * }}
 */
export const SEGMENT_PARENT = reduceEntryTotal(
  map(listKey(SEGMENT_KIND), makeControlEntry),
);

/**
 * @type {(
 *   kind: import("../parametrization").ClosureKind
 * ) => [
 *   import("../parametrization").ClosureKind,
 *   import("./parent").ClosureParent,
 * ]}
 */
const makeClosureEntry = (kind) => [kind, { type: "closure", kind }];

/**
 * @type {{
 *   [kind in import("../parametrization").ClosureKind]
 *     : import("./parent").ClosureParent
 * }}
 */
export const CLOSURE_PARENT = reduceEntryTotal(
  map(listKey(CLOSURE_KIND), makeClosureEntry),
);
