import { makeThrowErrorExpression } from "../intrinsic.mjs";

const {
  JSON: { stringify: stringifyJSON },
} = globalThis;

/** @type {(variable: import("../../estree").Variable) => string} */
export const reportDeadzone = (variable) =>
  `Cannot access variable ${stringifyJSON(variable)} before initialization`;

/** @type {(variable: import("../../estree").Variable) => string} */
export const reportConstant = (variable) =>
  `Cannot assign variable ${stringifyJSON(variable)} because it is constant`;

/** @type {(variable: import("../../estree").Variable) => string} */
export const reportFrozen = (variable) =>
  `Cannot declare variable ${stringifyJSON(variable)}`;

/** @type {(variable: import("../../estree").Variable) => string} */
export const reportMissing = (variable) =>
  `Variable ${stringifyJSON(variable)} is not defined`;

/** @type {(variable: import("../../estree").Variable) => string} */
export const reportUnboundExport = (variable) =>
  `Variable ${stringifyJSON(variable)} is exported but not declared`;

/** @type {(variable: import("../../estree").Specifier) => string} */
export const reportDuplicateExport = (specifier) =>
  `Specifier ${stringifyJSON(specifier)} has already been exported`;

/**
 * @type {(
 *   variable: import("../../estree").Variable,
 *   hash: import("../../hash").Hash,
 * ) => import("../atom").Expression}
 */
export const makeThrowDeadzoneExpression = (variable, hash) =>
  makeThrowErrorExpression("ReferenceError", reportDeadzone(variable), hash);

/**
 * @type {(
 *   variable: import("../../estree").Variable,
 *   hash: import("../../hash").Hash,
 * ) => import("../atom").Expression}
 */
export const makeThrowConstantExpression = (variable, hash) =>
  makeThrowErrorExpression("TypeError", reportConstant(variable), hash);

/**
 * @type {(
 *   variable: import("../../estree").Variable,
 *   hash: import("../../hash").Hash,
 * ) => import("../atom").Expression}
 */
export const makeThrowFrozenExpression = (variable, hash) =>
  makeThrowErrorExpression("TypeError", reportFrozen(variable), hash);

/**
 * @type {(
 *   variable: import("../../estree").Variable,
 *   hash: import("../../hash").Hash,
 * ) => import("../atom").Expression}
 */
export const makeThrowMissingExpression = (variable, hash) =>
  makeThrowErrorExpression("ReferenceError", reportMissing(variable), hash);
