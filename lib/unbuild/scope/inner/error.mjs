import { makeThrowErrorExpression } from "../../intrinsic.mjs";

const {
  JSON: { stringify: stringifyJSON },
} = globalThis;

/** @type {(variable: string) => string} */
const reportDeadzone = (variable) =>
  `Cannot access variable ${stringifyJSON(variable)} before initialization`;

/** @type {(variable: string) => string} */
const reportConstant = (variable) =>
  `Cannot assign variable ${stringifyJSON(variable)} because it is constant`;

/** @type {(variable: string) => string} */
const reportDuplicate = (variable) =>
  `Variable ${stringifyJSON(variable)} has already been declared`;

/** @type {(variable: string) => string} */
const reportMissing = (variable) =>
  `Variable ${stringifyJSON(variable)} is not defined`;

/**
 * @type {(
 *   variable: estree.Variable,
 *   origin: unbuild.Path,
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeThrowDeadzoneExpression = (variable, origin) =>
  makeThrowErrorExpression("ReferenceError", reportDeadzone(variable), origin);

/**
 * @type {(
 *   variable: estree.Variable,
 *   origin: unbuild.Path,
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeThrowConstantExpression = (variable, origin) =>
  makeThrowErrorExpression("TypeError", reportConstant(variable), origin);

/**
 * @type {(
 *   variable: estree.Variable,
 *   origin: unbuild.Path,
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeThrowDuplicateExpression = (variable, origin) =>
  makeThrowErrorExpression("SyntaxError", reportDuplicate(variable), origin);

/**
 * @type {(
 *   variable: estree.Variable,
 *   origin: unbuild.Path,
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeThrowMissingExpression = (variable, origin) =>
  makeThrowErrorExpression("ReferenceError", reportMissing(variable), origin);
