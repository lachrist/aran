import { DynamicError } from "../util/index.mjs";

import { parseBabel } from "./babel.mjs";

import {
  convertProgram,
  convertLink,
  convertClosureBlock,
  convertPseudoBlock,
  convertControlBlock,
  convertStatement,
  convertEffect,
  convertExpression,
} from "./convert.mjs";

/** @type {<N>(convert: (node:EstreeProgram) => N) => (code: string) => N} */
const compileParseProgram = (convert) => (code) => convert(parseBabel(code));

/** @type {<N> (convert: (node:EstreeProgramStatement) => N) => (code: string) => N} */
const compileParseStatement = (convert) => (code) => {
  const node = parseBabel(code);
  if (node.body.length !== 1) {
    throw new DynamicError("expected a single statement", node);
  }
  return convert(node.body[0]);
};

/** @type {<N> (convert: (nodes: EstreeProgramStatement[], parent: EstreeProgram) => N) => (code: string) => N} */
const compileParseStatementArray = (convert) => (code) => {
  const node = parseBabel(code);
  return convert(node.body, node);
};

/** @type {<N> (convert: (node:EstreeExpression) => N) => (code: string) => N} */
const compileParseExpression = (convert) => (code) => {
  const node = parseBabel(code);
  if (node.body.length !== 1) {
    throw new DynamicError("expected a single statement", node);
  }
  if (node.body[0].type !== "ExpressionStatement") {
    throw new DynamicError("expected a single expression statement", node);
  }
  return convert(node.body[0].expression);
};

export const parseProgram = compileParseProgram(convertProgram);

export const parseLink = compileParseStatement(convertLink);

export const parseControlBlock = compileParseStatement(convertControlBlock);

export const parsePseudoBlock = compileParseStatementArray(convertPseudoBlock);

export const parseClosureBlock = compileParseStatement(convertClosureBlock);

export const parseStatement = compileParseStatement(convertStatement);

export const parseExpression = compileParseExpression(convertExpression);

export const parseEffect = compileParseExpression(convertEffect);
