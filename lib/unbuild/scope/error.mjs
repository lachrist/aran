import { makeThrowErrorExpression } from "../intrinsic.mjs";

const {
  JSON: { stringify: stringifyJSON },
} = globalThis;

/** @type {(variable: string) => string} */
export const reportDeadzone = (variable) =>
  `Cannot access variable ${stringifyJSON(variable)} before initialization`;

/** @type {(variable: string) => string} */
export const reportConstant = (variable) =>
  `Cannot assign variable ${stringifyJSON(variable)} because it is constant`;

/** @type {(variable: string) => string} */
export const reportFrozen = (variable) =>
  `Cannot declare variable ${stringifyJSON(variable)}`;

/** @type {(variable: string) => string} */
export const reportDuplicate = (variable) =>
  `Variable ${stringifyJSON(variable)} has already been declared`;

/** @type {(variable: string) => string} */
export const reportMissing = (variable) =>
  `Variable ${stringifyJSON(variable)} is not defined`;

/**
 * @type {(
 *   variable: estree.Variable,
 *   path: unbuild.Path,
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeThrowDeadzoneExpression = (variable, path) =>
  makeThrowErrorExpression("ReferenceError", reportDeadzone(variable), path);

/**
 * @type {(
 *   variable: estree.Variable,
 *   path: unbuild.Path,
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeThrowConstantExpression = (variable, path) =>
  makeThrowErrorExpression("TypeError", reportConstant(variable), path);

/**
 * @type {(
 *   variable: estree.Variable,
 *   path: unbuild.Path,
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeThrowFrozenExpression = (variable, path) =>
  makeThrowErrorExpression("TypeError", reportFrozen(variable), path);

/**
 * @type {(
 *   variable: estree.Variable,
 *   path: unbuild.Path,
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeThrowDuplicateExpression = (variable, path) =>
  makeThrowErrorExpression("SyntaxError", reportDuplicate(variable), path);

/**
 * @type {(
 *   variable: estree.Variable,
 *   path: unbuild.Path,
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeThrowMissingExpression = (variable, path) =>
  makeThrowErrorExpression("ReferenceError", reportMissing(variable), path);
