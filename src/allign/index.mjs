import {
  parseExpression,
  parseEffect,
  parseLink,
  parseStatement,
  parseBlock,
  parseProgram,
  stringifyExpression,
  stringifyEffect,
  stringifyLink,
  stringifyStatement,
  stringifyBlock,
  stringifyProgram,
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

const generateAllign = (parse, stringify, visit) => (node, code) => {
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
    )}): mismatch between ${stringifyJSON(left)} and ${stringifyJSON(
      right,
    )}${"\n"}${stringify(node)}`;
  }
};

export const allignExpression = generateAllign(
  parseExpression,
  stringifyExpression,
  visitExpression,
);
export const allignEffect = generateAllign(
  parseEffect,
  stringifyEffect,
  visitEffect,
);
export const allignLink = generateAllign(parseLink, stringifyLink, visitLink);
export const allignStatement = generateAllign(
  parseStatement,
  stringifyStatement,
  visitStatement,
);
export const allignBlock = generateAllign(
  parseBlock,
  stringifyBlock,
  visitBlock,
);
export const allignProgram = generateAllign(
  parseProgram,
  stringifyProgram,
  visitProgram,
);
