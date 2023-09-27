import {
  makeThrowTypeErrorExpression,
  makeThrowReferenceErrorExpression,
  makeThrowSyntaxErrorExpression,
} from "../../intrinsic.mjs";

const {
  JSON: { stringify: stringifyJSON },
} = globalThis;

const reportDeadzone = (variable) =>
  `Cannot access variable ${stringifyJSON(variable)} before initialization`;

const reportConstant = (variable) =>
  `Cannot assign variable ${stringifyJSON(variable)} because it is constant`;

const reportDuplicate = (variable) =>
  `Variable ${stringifyJSON(variable)} has already been declared`;

const reportMissing = (variable) =>
  `Variable ${stringifyJSON(variable)} is not defined`;

export const makeThrowDeadzoneExpression = (variable) =>
  makeThrowReferenceErrorExpression(reportDeadzone(variable));

export const makeThrowConstantExpression = (variable) =>
  makeThrowTypeErrorExpression(reportConstant(variable));

export const makeThrowDuplicateExpression = (variable) =>
  makeThrowSyntaxErrorExpression(reportDuplicate(variable));

export const makeThrowMissingExpression = (variable) =>
  makeThrowReferenceErrorExpression(reportMissing(variable));
