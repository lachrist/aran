import { listKey, recordArrayTotal, return$ } from "../../util/index.mjs";
import { CLOSURE_KIND, SEGMENT_KIND } from "../parametrization.mjs";

/**
 * @type {(
 *   kind: import("../parametrization.d.ts").SegmentKind
 * ) => import("./parent.d.ts").SegmentParent}
 */
const makeSegmentParent = (kind) => ({ type: "segment", kind });

export const CONTROL_PARENT = recordArrayTotal(
  listKey(SEGMENT_KIND),
  return$,
  makeSegmentParent,
);

/**
 * @type {(
 *   kind: import("../parametrization.d.ts").ClosureKind
 * ) => import("./parent.d.ts").ClosureParent}
 */
const makeClosureParent = (kind) => ({ type: "closure", kind });

export const CLOSURE_PARENT = recordArrayTotal(
  listKey(CLOSURE_KIND),
  return$,
  makeClosureParent,
);
