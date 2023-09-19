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

/** @type {<T>(variable: estree.Variable, tag: T) => aran.Expression<unbuild.Atom<T>>} */
export const makeThrowDeadzoneExpression = (variable, tag) =>
  makeThrowErrorExpression("ReferenceError", reportDeadzone(variable), tag);

/** @type {<T>(variable: estree.Variable, tag: T) => aran.Expression<unbuild.Atom<T>>} */
export const makeThrowConstantExpression = (variable, tag) =>
  makeThrowErrorExpression("TypeError", reportConstant(variable), tag);

/** @type {<T>(variable: estree.Variable, tag: T) => aran.Expression<unbuild.Atom<T>>} */
export const makeThrowDuplicateExpression = (variable, tag) =>
  makeThrowErrorExpression("SyntaxError", reportDuplicate(variable), tag);

/** @type {<T>(variable: estree.Variable, tag: T) => aran.Expression<unbuild.Atom<T>>} */
export const makeThrowMissingExpression = (variable, tag) =>
  makeThrowErrorExpression("ReferenceError", reportMissing(variable), tag);
