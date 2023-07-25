import { parseBabel } from "./babel.mjs";

import {
  convertProgram,
  convertLink,
  convertBlock,
  convertStatement,
  convertEffect,
  convertExpression,
} from "./convert.mjs";

const { Error } = globalThis;

/**
 * @template N
 * @param {(node: EstreeProgram) => N} convert
 * @return {(code: string) => N}
 */
const compileParseProgram = (convert) => (code) => convert(parseBabel(code));

/**
 * @template N
 * @param {(node: EstreeProgramStatement) => N} convert
 * @return {(code: string) => N}
 */
const compileParseStatement = (convert) => (code) => {
  const node = parseBabel(code);
  if (node.body.length !== 1) {
    throw new Error("expected a single statement");
  }
  return convert(node.body[0]);
};

/**
 * @template N
 * @param {(node: EstreeExpression) => N} convert
 * @return {(code: string) => N}
 */
const compileParseExpression = (convert) => (code) => {
  const node = parseBabel(code);
  if (node.body.length !== 1) {
    throw new Error("expected a single statement");
  }
  if (node.body[0].type !== "ExpressionStatement") {
    throw new Error("expected a single expression statement");
  }
  return convert(node.body[0].expression);
};

export const parseProgram = compileParseProgram(convertProgram);

export const parseLink = compileParseStatement(convertLink);

export const parseBlock = compileParseStatement(convertBlock);

export const parseStatement = compileParseStatement(convertStatement);

export const parseExpression = compileParseExpression(convertExpression);

export const parseEffect = compileParseExpression(convertEffect);
