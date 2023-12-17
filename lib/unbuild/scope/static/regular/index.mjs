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
 *   context: {
 *     mode: "strict" | "sloppy",
 *   },
 *   options: {
 *     kind: import(".").RegularKind,
 *     variable: estree.Variable,
 *     exports: Record<estree.Variable, estree.Specifier[]>,
 *   },
 * ) => import("../../../sequence.js").PreludeSequence<
 *   import(".").RegularBinding,
 * >}
 */
export const bindRegular = (site, context, { kind, variable, exports }) => {
  if (isHoistingKind(kind)) {
    return bindHoistingRegular(site, context, { kind, variable, exports });
  } else if (isDeadzoneKind(kind)) {
    return bindDeadzoneRegular(site, context, { kind, variable, exports });
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
 *     binding: import(".").RegularBinding,
 *     variable: estree.Variable,
 *     right: import("../../../cache").Cache | null,
 *   },
 * ) => aran.Effect<unbuild.Atom>[]}
 */
export const listRegularSaveEffect = (
  site,
  context,
  { operation, binding, variable, right },
) => {
  if (isHoistingBinding(binding)) {
    return listHoistingRegularSaveEffect(site, context, {
      operation,
      binding,
      variable,
      right,
    });
  } else if (isDeadzoneBinding(binding)) {
    return listDeadzoneRegularSaveEffect(site, context, {
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
 *     binding: import(".").RegularBinding,
 *     variable: estree.Variable,
 *   },
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeRegularLoadExpression = (
  site,
  context,
  { operation, binding, variable },
) => {
  if (isHoistingBinding(binding)) {
    return makeHoistingRegularLoadExpression(site, context, {
      operation,
      binding,
      variable,
    });
  } else if (isDeadzoneBinding(binding)) {
    return makeDeadzoneRegularLoadExpression(site, context, {
      operation,
      binding,
      variable,
    });
  } else {
    throw new AranTypeError("invalid binding", binding);
  }
};
