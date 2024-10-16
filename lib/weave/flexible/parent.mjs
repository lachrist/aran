import { AranTypeError } from "../../error.mjs";
import { listKey, recordArrayTotal, return$ } from "../../util/index.mjs";
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
 * ) => import("./parent").SegmentParent}
 */
const makeSegmentParent = (kind) => ({
  type: "segment",
  kind,
});

export const SEGMENT_PARENT = recordArrayTotal(
  listKey(SEGMENT_KIND),
  return$,
  makeSegmentParent,
);

/**
 * @type {(
 *   kind: import("../parametrization").ClosureKind
 * ) => import("./parent").ClosureParent}
 */
const makeClosureParent = (kind) => ({ type: "closure", kind });

/**
 * @type {{
 *   [kind in import("../parametrization").ClosureKind]
 *     : import("./parent").ClosureParent
 * }}
 */
export const CLOSURE_PARENT = recordArrayTotal(
  listKey(CLOSURE_KIND),
  return$,
  makeClosureParent,
);
