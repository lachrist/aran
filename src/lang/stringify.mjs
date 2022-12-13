import {stringifyPrettier} from "./prettier.mjs";
import {
  revertExpression,
  revertEffect,
  revertLink,
  revertBlock,
  revertStatement,
  revertProgram,
} from "./revert.mjs";

const makeProgram = (body) => ({
  type: "Program",
  sourceType: "module",
  body,
});
const makeExpressionStatement = (expression) => ({
  type: "ExpressionStatement",
  expression,
});

const generateStringifyExpression = (revert) => (node) =>
  stringifyPrettier(makeProgram([makeExpressionStatement(revert(node))]));
const generateStringifyStatement = (revert) => (node) =>
  stringifyPrettier(makeProgram([revert(node)]));
const generateStringifyProgram = (revert) => (node) =>
  stringifyPrettier(revert(node));

export const stringifyEffect = generateStringifyExpression(revertEffect);
export const stringifyExpression =
  generateStringifyExpression(revertExpression);
export const stringifyStatement = generateStringifyStatement(revertStatement);
export const stringifyLink = generateStringifyStatement(revertLink);
export const stringifyBlock = generateStringifyStatement(revertBlock);
export const stringifyProgram = generateStringifyProgram(revertProgram);
