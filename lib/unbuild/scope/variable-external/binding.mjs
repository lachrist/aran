import { AranTypeError } from "../../../error.mjs";
import { isDeadzoneHoist, isLifespanHoist } from "../../query/index.mjs";
import {
  bindDeadzoneExternal,
  listDeadzoneExternalSaveEffect,
  makeDeadzoneExternalLoadExpression,
} from "./deadzone.mjs";
import {
  bindLifespanExternal,
  listLifespanExternalSaveEffect,
  makeLifespanExternalLoadExpression,
} from "./lifespan.mjs";

/**
 * @type {(
 *   site: import("../../site").LeafSite,
 *   hoist: (
 *     | import("../../query/hoist").DeadzoneHoist
 *     | import("../../query/hoist").LifespanHoist
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
  if (isLifespanHoist(hoist)) {
    return bindLifespanExternal(site, hoist, options);
  } else if (isDeadzoneHoist(hoist)) {
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
  if (binding.kind === "var" || binding.kind === "function") {
    return listLifespanExternalSaveEffect(site, binding, operation);
  } else if (
    binding.kind === "let" ||
    binding.kind === "const" ||
    binding.kind === "class"
  ) {
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
  if (binding.kind === "var" || binding.kind === "function") {
    return makeLifespanExternalLoadExpression(site, binding, operation);
  } else if (
    binding.kind === "let" ||
    binding.kind === "const" ||
    binding.kind === "class"
  ) {
    return makeDeadzoneExternalLoadExpression(site, binding, operation);
  } else {
    throw new AranTypeError(binding.kind);
  }
};
