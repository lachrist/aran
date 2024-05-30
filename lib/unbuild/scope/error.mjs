import { makeThrowErrorExpression } from "../intrinsic.mjs";

const {
  JSON: { stringify: stringifyJSON },
} = globalThis;

/** @type {(variable: estree.Variable) => string} */
export const reportDeadzone = (variable) =>
  `Cannot access variable ${stringifyJSON(variable)} before initialization`;

/** @type {(variable: estree.Variable) => string} */
export const reportConstant = (variable) =>
  `Cannot assign variable ${stringifyJSON(variable)} because it is constant`;

/** @type {(variable: estree.Variable) => string} */
export const reportFrozen = (variable) =>
  `Cannot declare variable ${stringifyJSON(variable)}`;

/** @type {(variable: estree.Variable) => string} */
export const reportDuplicate = (variable) =>
  `Variable ${stringifyJSON(variable)} has already been declared`;

/** @type {(variable: estree.Variable) => string} */
export const reportMissing = (variable) =>
  `Variable ${stringifyJSON(variable)} is not defined`;

/** @type {(variable: estree.Variable) => string} */
export const reportUnboundExport = (variable) =>
  `Variable ${stringifyJSON(variable)} is exported but not declared`;

/** @type {(variable: estree.Specifier) => string} */
export const reportDuplicateExport = (specifier) =>
  `Specifier ${stringifyJSON(specifier)} has already been exported`;

/**
 * @type {(
 *   variable: estree.Variable,
 *   path: import("../../path").Path,
 * ) => aran.Expression<import("../atom").Atom>}
 */
export const makeThrowDeadzoneExpression = (variable, path) =>
  makeThrowErrorExpression("ReferenceError", reportDeadzone(variable), path);

/**
 * @type {(
 *   variable: estree.Variable,
 *   path: import("../../path").Path,
 * ) => aran.Expression<import("../atom").Atom>}
 */
export const makeThrowConstantExpression = (variable, path) =>
  makeThrowErrorExpression("TypeError", reportConstant(variable), path);

/**
 * @type {(
 *   variable: estree.Variable,
 *   path: import("../../path").Path,
 * ) => aran.Expression<import("../atom").Atom>}
 */
export const makeThrowFrozenExpression = (variable, path) =>
  makeThrowErrorExpression("TypeError", reportFrozen(variable), path);

/**
 * @type {(
 *   variable: estree.Variable,
 *   path: import("../../path").Path,
 * ) => aran.Expression<import("../atom").Atom>}
 */
export const makeThrowDuplicateExpression = (variable, path) =>
  makeThrowErrorExpression("SyntaxError", reportDuplicate(variable), path);

/**
 * @type {(
 *   variable: estree.Variable,
 *   path: import("../../path").Path,
 * ) => aran.Expression<import("../atom").Atom>}
 */
export const makeThrowMissingExpression = (variable, path) =>
  makeThrowErrorExpression("ReferenceError", reportMissing(variable), path);
