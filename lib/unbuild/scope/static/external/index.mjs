import { AranTypeError } from "../../../../error.mjs";
import {
  bindDeadzoneExternal,
  listDeadzoneExternalSaveEffect,
  makeDeadzoneExternalLoadExpression,
} from "./deadzone.mjs";
import {
  bindHoistingExternal,
  listHoistingExternalSaveEffect,
  makeHoistingExternalLoadExpression,
} from "./hoisting.mjs";

/**
 * @type {(
 *   kind: import(".").ExternalKind
 * ) => kind is import(".").HoistingExternalKind}
 */
const isHoistingKind = (kind) => kind === "var" || kind === "function";

/**
 * @type {(
 *   kind: import(".").ExternalKind
 * ) => kind is import(".").DeadzoneExternalKind}
 */
const isDeadzoneKind = (kind) =>
  kind === "let" || kind === "const" || kind === "class";

/**
 * @type {(
 *   binding: import(".").ExternalBinding
 * ) => binding is import(".").HoistingExternalBinding}
 */
const isHoistingBinding = (binding) => isHoistingKind(binding.kind);
/**
 * @type {(
 *   binding: import(".").ExternalBinding
 * ) => binding is import(".").DeadzoneExternalBinding}
 */
const isDeadzoneBinding = (binding) => isDeadzoneKind(binding.kind);

/**
 * @type {(
 *   site: {
 *     path: unbuild.Path,
 *     meta: unbuild.Meta,
 *   },
 *   kind: import(".").ExternalKind,
 *   options: {
 *     mode: "strict" | "sloppy",
 *     variable: estree.Variable,
 *   },
 * ) => import("../../../sequence.js").PreludeSequence<
 *   import(".").ExternalBinding,
 * >}
 */
export const setupExternalBinding = (site, kind, options) => {
  if (isHoistingKind(kind)) {
    return bindHoistingExternal(site, kind, options);
  } else if (isDeadzoneKind(kind)) {
    return bindDeadzoneExternal(site, kind, options);
  } else {
    throw new AranTypeError("invalid kind", kind);
  }
};

/**
 * @type {(
 *   site: {
 *     path: unbuild.Path,
 *   },
 *   binding: import(".").ExternalBinding,
 *   operation: (
 *     | import("../..").InitializeOperation
 *     | import("../..").WriteOperation
 *   ),
 * ) => aran.Effect<unbuild.Atom>[]}
 */
export const listExternalSaveEffect = (site, binding, operation) => {
  if (isHoistingBinding(binding)) {
    return listHoistingExternalSaveEffect(site, binding, operation);
  } else if (isDeadzoneBinding(binding)) {
    return listDeadzoneExternalSaveEffect(site, binding, operation);
  } else {
    throw new AranTypeError("invalid binding", binding);
  }
};

/**
 * @type {(
 *   site: {
 *     path: unbuild.Path,
 *   },
 *   binding: import(".").ExternalBinding,
 *   operation: (
 *     | import("../..").ReadOperation
 *     | import("../..").TypeofOperation
 *     | import("../..").DiscardOperation
 *   ),
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeExternalLoadExpression = (site, binding, operation) => {
  if (isHoistingBinding(binding)) {
    return makeHoistingExternalLoadExpression(site, binding, operation);
  } else if (isDeadzoneBinding(binding)) {
    return makeDeadzoneExternalLoadExpression(site, binding, operation);
  } else {
    throw new AranTypeError("invalid binding", binding);
  }
};
