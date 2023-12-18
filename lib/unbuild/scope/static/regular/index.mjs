import { AranTypeError } from "../../../../error.mjs";
import {
  bindDeadzoneRegular,
  listDeadzoneRegularSaveEffect,
  makeDeadzoneRegularLoadExpression,
} from "./deadzone.mjs";
import {
  bindHoistingRegular,
  listHoistingRegularSaveEffect,
  makeHoistingRegularLoadExpression,
} from "./hoisting.mjs";

/**
 * @type {(
 *   kind: import(".").RegularKind
 * ) => kind is import(".").HoistingRegularKind}
 */
const isHoistingKind = (kind) =>
  kind === "var" || kind === "function" || kind === "callee";

/**
 * @type {(
 *   kind: import(".").RegularKind
 * ) => kind is import(".").DeadzoneRegularKind}
 */
const isDeadzoneKind = (kind) =>
  kind === "let" || kind === "const" || kind === "class";

/**
 * @type {(
 *   binding: import(".").RegularBinding
 * ) => binding is import(".").HoistingRegularBinding}
 */
const isHoistingBinding = (binding) => isHoistingKind(binding.kind);
/**
 * @type {(
 *   binding: import(".").RegularBinding
 * ) => binding is import(".").DeadzoneRegularBinding}
 */
const isDeadzoneBinding = (binding) => isDeadzoneKind(binding.kind);

/**
 * @type {(
 *   site: {
 *     path: unbuild.Path,
 *   },
 *   kind: import(".").RegularKind,
 *   options: {
 *     mode: "strict" | "sloppy",
 *     variable: estree.Variable,
 *     exports: Record<estree.Variable, estree.Specifier[]>,
 *   },
 * ) => import("../../../sequence.js").PreludeSequence<
 *   import(".").RegularBinding,
 * >}
 */
export const bindRegular = (site, kind, options) => {
  if (isHoistingKind(kind)) {
    return bindHoistingRegular(site, kind, options);
  } else if (isDeadzoneKind(kind)) {
    return bindDeadzoneRegular(site, kind, options);
  } else {
    throw new AranTypeError("invalid kind", kind);
  }
};

/**
 * @type {(
 *   site: {
 *     path: unbuild.Path,
 *   },
 *   binding: import(".").RegularBinding,
 *   operation: (
 *     | import("../..").InitializeOperation
 *     | import("../..").WriteOperation
 *   ),
 * ) => aran.Effect<unbuild.Atom>[]}
 */
export const listRegularSaveEffect = (site, binding, options) => {
  if (isHoistingBinding(binding)) {
    return listHoistingRegularSaveEffect(site, binding, options);
  } else if (isDeadzoneBinding(binding)) {
    return listDeadzoneRegularSaveEffect(site, binding, options);
  } else {
    throw new AranTypeError("invalid binding", binding);
  }
};

/**
 * @type {(
 *   site: {
 *     path: unbuild.Path,
 *   },
 *   binding: import(".").RegularBinding,
 *   operation: (
 *     | import("../..").ReadOperation
 *     | import("../..").TypeofOperation
 *     | import("../..").DiscardOperation
 *   ),
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeRegularLoadExpression = (site, binding, options) => {
  if (isHoistingBinding(binding)) {
    return makeHoistingRegularLoadExpression(site, binding, options);
  } else if (isDeadzoneBinding(binding)) {
    return makeDeadzoneRegularLoadExpression(site, binding, options);
  } else {
    throw new AranTypeError("invalid binding", binding);
  }
};
