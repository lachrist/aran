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

/** @type {<S>(variable: estree.Variable, serial: S) => aran.Expression<unbuild.Atom<S>>} */
export const makeThrowDeadzoneExpression = (variable, serial) =>
  makeThrowErrorExpression("ReferenceError", reportDeadzone(variable), serial);

/** @type {<S>(variable: estree.Variable, serial: S) => aran.Expression<unbuild.Atom<S>>} */
export const makeThrowConstantExpression = (variable, serial) =>
  makeThrowErrorExpression("TypeError", reportConstant(variable), serial);

/** @type {<S>(variable: estree.Variable, serial: S) => aran.Expression<unbuild.Atom<S>>} */
export const makeThrowDuplicateExpression = (variable, serial) =>
  makeThrowErrorExpression("SyntaxError", reportDuplicate(variable), serial);

/** @type {<S>(variable: estree.Variable, serial: S) => aran.Expression<unbuild.Atom<S>>} */
export const makeThrowMissingExpression = (variable, serial) =>
  makeThrowErrorExpression("ReferenceError", reportMissing(variable), serial);
