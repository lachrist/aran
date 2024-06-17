import { AranTypeError } from "../../error.mjs";
import { listKey, map, reduceEntryTotal } from "../../util/index.mjs";
import { CLOSURE_KIND, CONTROL_KIND } from "../parametrization.mjs";

/**
 * @type {(
 *   parent: import("./parent").Parent,
 * ) => null | import("./parent").ProgramParent}
 */
export const toProgramParent = (parent) => {
  if (parent.type === "program") {
    return parent;
  } else if (parent.type === "closure" || parent.type === "control") {
    return null;
  } else {
    throw new AranTypeError(parent);
  }
};

/**
 * @type {(
 *   kind: import("../..").ControlKind
 * ) => [
 *   import("../..").ControlKind,
 *   import("./parent").ControlParent,
 * ]}
 */
const makeControlEntry = (kind) => [kind, { type: "control", kind }];

/**
 * @type {{
 *   [kind in import("../parametrization").ControlKind]
 *     : import("./parent").ControlParent
 * }}
 */
export const CONTROL_PARENT = reduceEntryTotal(
  map(listKey(CONTROL_KIND), makeControlEntry),
);

/**
 * @type {(
 *   kind: import("../..").ClosureKind
 * ) => [
 *   import("../..").ClosureKind,
 *   import("./parent").ClosureParent,
 * ]}
 */
const makeClosureEntry = (kind) => [kind, { type: "closure", kind }];

/**
 * @type {{
 *   [kind in import("../parametrization").ClosureKind]
 *     : import("./parent").ClosureParent & { kind: kind }
 * }}
 */
export const CLOSURE_PARENT = /** @type {any} */ (
  reduceEntryTotal(map(listKey(CLOSURE_KIND), makeClosureEntry))
);
