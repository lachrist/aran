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
 *   entry: import(".").ExternalEntry
 * ) => entry is import(".").HoistingExternalEntry}
 */
const isHoistingEntry = (entry) => entry[1] === "var";

/**
 * @type {(
 *   entry: import(".").ExternalEntry
 * ) => entry is import(".").DeadzoneExternalEntry}
 */
const isDeadzoneKind = (entry) => entry[1] === "let" || entry[1] === "const";

/**
 * @type {(
 *   binding: import(".").ExternalBinding
 * ) => binding is import(".").HoistingExternalBinding}
 */
const isHoistingBinding = (binding) => binding.kind === "var";

/**
 * @type {(
 *   binding: import(".").ExternalBinding
 * ) => binding is import(".").DeadzoneExternalBinding}
 */
const isDeadzoneBinding = (binding) =>
  binding.kind === "let" || binding.kind === "const";

/**
 * @type {(
 *   site: import("../../site").LeafSite,
 *   entry: import(".").ExternalEntry,
 *   options: {
 *     mode: "strict" | "sloppy",
 *   },
 * ) => import("../../sequence").SetupSequence<[
 *   estree.Variable,
 *   import(".").ExternalBinding,
 * ]>}
 */
export const setupExternalBinding = (site, entry, options) => {
  if (isHoistingEntry(entry)) {
    return bindHoistingExternal(site, entry, options);
  } else if (isDeadzoneKind(entry)) {
    return bindDeadzoneExternal(site, entry, options);
  } else {
    throw new AranTypeError(entry);
  }
};

/**
 * @type {(
 *   site: import("../../site").VoidSite,
 *   binding: import(".").ExternalBinding,
 *   operation: import("..").VariableSaveOperation,
 * ) => import("../../sequence").EffectSequence}
 */
export const listExternalBindingSaveEffect = (site, binding, operation) => {
  if (isHoistingBinding(binding)) {
    return listHoistingExternalSaveEffect(site, binding, operation);
  } else if (isDeadzoneBinding(binding)) {
    return listDeadzoneExternalSaveEffect(site, binding, operation);
  } else {
    throw new AranTypeError(binding);
  }
};

/**
 * @type {(
 *   site: import("../../site").VoidSite,
 *   binding: import(".").ExternalBinding,
 *   operation: import("..").VariableLoadOperation
 * ) => import("../../sequence").ExpressionSequence}
 */
export const makeExternalBindingLoadExpression = (site, binding, operation) => {
  if (isHoistingBinding(binding)) {
    return makeHoistingExternalLoadExpression(site, binding, operation);
  } else if (isDeadzoneBinding(binding)) {
    return makeDeadzoneExternalLoadExpression(site, binding, operation);
  } else {
    throw new AranTypeError(binding);
  }
};
