import { makeThrowErrorExpression } from "../intrinsic.mjs";

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

/** @type {<T>(variable: string) => Expression<T>} */
export const makeThrowDeadzoneExpression = (variable) =>
  makeThrowErrorExpression("ReferenceError", reportDeadzone(variable));

/** @type {<T>(variable: string) => Expression<T>} */
export const makeThrowConstantExpression = (variable) =>
  makeThrowErrorExpression("TypeError", reportConstant(variable));

/** @type {<T>(variable: string) => Expression<T>} */
export const makeThrowDuplicateExpression = (variable) =>
  makeThrowErrorExpression("SyntaxError", reportDuplicate(variable));

/** @type {<T>(variable: string) => Expression<T>} */
export const makeThrowMissingExpression = (variable) =>
  makeThrowErrorExpression("ReferenceError", reportMissing(variable));
