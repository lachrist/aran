/**
 * @type {<V, L>(
 *   value: V,
 *   location: L,
 * ) => import("./point").Point<V, L>}
 */
export const makeReturnBeforePoint = (value, location) => ({
  type: "return.before",
  value,
  location,
});

/**
 * @type {<V, L>(
 *   kind: import("./point").BranchKind,
 *   value: V,
 *   location: L,
 * ) => import("./point").Point<V, L>}
 */
export const makeBranchBeforePoint = (kind, value, location) => ({
  type: "branch.before",
  kind,
  value,
  location,
});

/**
 * @type {<V, L>(
 *   kind: import("./point").BranchKind,
 *   value: V,
 *   location: L,
 * ) => import("./point").Point<V, L>}
 */
export const makeBranchAfterPoint = (kind, value, location) => ({
  type: "branch.after",
  kind,
  value,
  location,
});

/**
 * @type {<V, L>(
 *   value: V,
 *   location: L,
 * ) => import("./point").Point<V, L>}
 */
export const makeDropBeforePoint = (value, location) => ({
  type: "drop.before",
  value,
  location,
});

/**
 * @type {<V, L>(
 *   variable: import("./atom").ArgVariable | aran.Parameter,
 *   value: V,
 *   location: L,
 * ) => import("./point").Point<V, L>}
 */
export const makeWriteBeforePoint = (variable, value, location) => ({
  type: "write.before",
  variable,
  value,
  location,
});

/**
 * @type {<V, L>(
 *   specifier: estree.Specifier,
 *   value: V,
 *   location: L,
 * ) => import("./point").Point<V, L>}
 */
export const makeExportBeforePoint = (specifier, value, location) => ({
  type: "export.before",
  specifier,
  value,
  location,
});

/**
 * @type {<V, L>(
 *   callee: V,
 *   this_: V,
 *   arguments_: V[],
 *   location: L,
 * ) => import("./point").Point<V, L>}
 */
export const makeApplyPoint = (callee, this_, arguments_, location) => ({
  type: "apply",
  callee,
  this: this_,
  arguments: arguments_,
  location,
});

/**
 * @type {<V, L>(
 *   callee: V,
 *   arguments_: V[],
 *   location: L,
 * ) => import("./point").Point<V, L>}
 */
export const makeConstructPoint = (callee, arguments_, location) => ({
  type: "construct",
  callee,
  arguments: arguments_,
  location,
});

/**
 * @type {<V, L>(
 *   value: V,
 *   context: import("../context").Context,
 *   location: L,
 * ) => import("./point").Point<V, L>}
 */
export const makeEvalBeforePoint = (value, context, location) => ({
  type: "eval.before",
  value,
  context,
  location,
});

/**
 * @type {<V, L>(
 *   value: V,
 *   location: L,
 * ) => import("./point").Point<V, L>}
 */
export const makeEvalAfterPoint = (value, location) => ({
  type: "eval.after",
  value,
  location,
});

/**
 * @type {<V, L>(
 *   delegate: boolean,
 *   value: V,
 *   location: L,
 * ) => import("./point").Point<V, L>}
 */
export const makeYieldBeforePoint = (delegate, value, location) => ({
  type: "yield.before",
  delegate,
  value,
  location,
});

/**
 * @type {<V, L>(
 *   delegate: boolean,
 *   value: V,
 *   location: L,
 * ) => import("./point").Point<V, L>}
 */
export const makeYieldAfterPoint = (delegate, value, location) => ({
  type: "yield.after",
  delegate,
  value,
  location,
});

/**
 * @type {<V, L>(
 *   label: import("./atom").Label,
 *   location: L,
 * ) => import("./point").Point<V, L>}
 */
export const makeBreakBeforePoint = (label, location) => ({
  type: "break.before",
  label,
  location,
});

/**
 * @type {<V, L>(
 *   value: V,
 *   location: L,
 * ) => import("./point").Point<V, L>}
 */
export const makeAwaitBeforePoint = (value, location) => ({
  type: "await.before",
  value,
  location,
});

/**
 * @type {<V, L>(
 *   value: V,
 *   location: L,
 * ) => import("./point").Point<V, L>}
 */
export const makeAwaitAfterPoint = (value, location) => ({
  type: "await.after",
  value,
  location,
});

/**
 * @type {<V, L>(
 *   frame: import("./frame").Frame,
 *   location: L,
 * ) => import("./point").Point<V, L>}
 */
export const makeBlockEnterPoint = ({ record, ...frame }, location) => ({
  type: "block.enter",
  frame,
  // eslint-disable-next-line object-shorthand
  record: /** @type {any} */ (record),
  location,
});
