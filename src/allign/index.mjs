import {
  parseExpression,
  parseEffect,
  parseLink,
  parseStatement,
  parseBlock,
  parseProgram,
} from "../lang/index.mjs";
import {
  makeRootError,
  getErrorMessage,
  getErrorLeft,
  getErrorRight,
} from "./error.mjs";
import {getResultError} from "./result.mjs";
import {
  visitExpression,
  visitEffect,
  visitLink,
  visitStatement,
  visitBlock,
  visitProgram,
} from "./visit.mjs";

const {
  String,
  JSON: {stringify: stringifyJSON},
} = globalThis;

const generateAllign = (parse, visit) => (node, code) => {
  const error = getResultError(visit(makeRootError(), node, parse(code)));
  if (error === null) {
    return null;
  } else {
    const message = getErrorMessage(error);
    const {value: left} = getErrorLeft(error);
    const {
      value: right,
      annotation: {
        start: {line, column},
      },
    } = getErrorRight(error);
    return `${message} (${String(line)}-${String(
      column,
    )}): mismatch between ${stringifyJSON(left)} and ${stringifyJSON(right)}`;
  }
};

export const allignExpression = generateAllign(
  parseExpression,
  visitExpression,
);
export const allignEffect = generateAllign(parseEffect, visitEffect);
export const allignLink = generateAllign(parseLink, visitLink);
export const allignStatement = generateAllign(parseStatement, visitStatement);
export const allignBlock = generateAllign(parseBlock, visitBlock);
export const allignProgram = generateAllign(parseProgram, visitProgram);
