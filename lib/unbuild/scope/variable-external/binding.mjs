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
 *   site: import("../../site").LeafSite,
 *   hoist: (
 *     | import("../../query/hoist").ClosureHoist
 *     | import("../../query/hoist").BlockHoist
 *   ),
 *   options: {
 *     mode: "strict" | "sloppy",
 *   },
 * ) => import("../../sequence").Sequence<
 *   import("../../prelude").NodePrelude,
 *   [
 *     estree.Variable,
 *     import(".").ExternalBinding,
 *   ],
 * >}
 */
export const setupExternalBinding = (site, hoist, options) => {
  if (hoist.type === "closure") {
    return bindHoistingExternal(site, hoist, options);
  } else if (hoist.type === "block") {
    return bindDeadzoneExternal(site, hoist, options);
  } else {
    throw new AranTypeError(hoist);
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
  if (binding.kind === "var") {
    return listHoistingExternalSaveEffect(site, binding, operation);
  } else if (binding.kind === "let" || binding.kind === "const") {
    return listDeadzoneExternalSaveEffect(site, binding, operation);
  } else {
    throw new AranTypeError(binding.kind);
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
  if (binding.kind === "var") {
    return makeHoistingExternalLoadExpression(site, binding, operation);
  } else if (binding.kind === "let" || binding.kind === "const") {
    return makeDeadzoneExternalLoadExpression(site, binding, operation);
  } else {
    throw new AranTypeError(binding.kind);
  }
};
