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
 *   context: {
 *     mode: "strict" | "sloppy",
 *   },
 *   options: {
 *     kind: import(".").ExternalKind,
 *     variable: estree.Variable,
 *   },
 * ) => import("../../../sequence.js").PreludeSequence<
 *   import(".").ExternalBinding,
 * >}
 */
export const bindExternal = (site, context, { kind, variable }) => {
  if (isHoistingKind(kind)) {
    return bindHoistingExternal(site, context, { kind, variable });
  } else if (isDeadzoneKind(kind)) {
    return bindDeadzoneExternal(site, context, { kind, variable });
  } else {
    throw new AranTypeError("invalid kind", kind);
  }
};

/**
 * @type {(
 *   site: {
 *     path: unbuild.Path,
 *   },
 *   context: {
 *     mode: "strict" | "sloppy",
 *   },
 *   options: {
 *     operation: "initialize" | "write",
 *     binding: import(".").ExternalBinding,
 *     variable: estree.Variable,
 *     right: import("../../../cache").Cache | null,
 *   },
 * ) => aran.Effect<unbuild.Atom>[]}
 */
export const listExternalSaveEffect = (
  site,
  context,
  { operation, binding, variable, right },
) => {
  if (isHoistingBinding(binding)) {
    return listHoistingExternalSaveEffect(site, context, {
      operation,
      binding,
      variable,
      right,
    });
  } else if (isDeadzoneBinding(binding)) {
    return listDeadzoneExternalSaveEffect(site, context, {
      operation,
      binding,
      variable,
      right,
    });
  } else {
    throw new AranTypeError("invalid binding", binding);
  }
};

/**
 * @type {(
 *   site: {
 *     path: unbuild.Path,
 *   },
 *   context: {
 *     mode: "strict" | "sloppy",
 *   },
 *   options: {
 *     operation: "read" | "typeof" | "discard",
 *     binding: import(".").ExternalBinding,
 *     variable: estree.Variable,
 *   },
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeExternalLoadExpression = (
  site,
  context,
  { operation, binding, variable },
) => {
  if (isHoistingBinding(binding)) {
    return makeHoistingExternalLoadExpression(site, context, {
      operation,
      binding,
      variable,
    });
  } else if (isDeadzoneBinding(binding)) {
    return makeDeadzoneExternalLoadExpression(site, context, {
      operation,
      binding,
      variable,
    });
  } else {
    throw new AranTypeError("invalid binding", binding);
  }
};
