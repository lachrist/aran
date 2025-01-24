import { listKey, recordArrayTotal, return$ } from "../../util/index.mjs";
import { CLOSURE_KIND, SEGMENT_KIND } from "../parametrization.mjs";

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
