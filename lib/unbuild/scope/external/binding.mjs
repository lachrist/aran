import { AranTypeError } from "../../../error.mjs";
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
const isHoistingKind = (kind) => kind === "var";

/**
 * @type {(
 *   kind: import(".").ExternalKind
 * ) => kind is import(".").DeadzoneExternalKind}
 */
const isDeadzoneKind = (kind) => kind === "let" || kind === "const";

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
 *   site: import("../../site").LeafSite,
 *   kind: import(".").ExternalKind,
 *   options: {
 *     mode: "strict" | "sloppy",
 *     variable: estree.Variable,
 *   },
 * ) => import("../../sequence.js").PreludeSequence<
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
 *   site: import("../../site").VoidSite,
 *   binding: import(".").ExternalBinding,
 *   operation: import("..").VariableSaveOperation,
 * ) => aran.Effect<unbuild.Atom>[]}
 */
export const listExternalBindingSaveEffect = (site, binding, operation) => {
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
 *   site: import("../../site").VoidSite,
 *   binding: import(".").ExternalBinding,
 *   operation: import("..").VariableLoadOperation
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeExternalBindingLoadExpression = (site, binding, operation) => {
  if (isHoistingBinding(binding)) {
    return makeHoistingExternalLoadExpression(site, binding, operation);
  } else if (isDeadzoneBinding(binding)) {
    return makeDeadzoneExternalLoadExpression(site, binding, operation);
  } else {
    throw new AranTypeError("invalid binding", binding);
  }
};
