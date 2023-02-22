import { assert } from "../util/index.mjs";

import { parseBabel } from "../babel.mjs";

import {
  convertProgram,
  convertLink,
  convertBlock,
  convertStatement,
  convertEffect,
  convertExpression,
} from "./convert.mjs";

const generateParseProgram = (convert) => (code) => convert(parseBabel(code));

const generateParseStatement = (convert) => (code) => {
  const node = parseBabel(code);
  assert(node.type === "Program");
  assert(node.body.length === 1);
  return convert(node.body[0]);
};

const generateParseExpression = (convert) => (code) => {
  const node = parseBabel(code);
  assert(node.type === "Program");
  assert(node.body.length === 1);
  assert(node.body[0].type === "ExpressionStatement");
  return convert(node.body[0].expression);
};

export const parseProgram = generateParseProgram(convertProgram);
export const parseLink = generateParseStatement(convertLink);
export const parseBlock = generateParseStatement(convertBlock);
export const parseStatement = generateParseStatement(convertStatement);
export const parseExpression = generateParseExpression(convertExpression);
export const parseEffect = generateParseExpression(convertEffect);
