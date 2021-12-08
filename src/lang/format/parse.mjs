import {assert} from "../../util.mjs";
import {parseAcornLoose} from "./acorn.mjs";
import {
  convertProgram,
  convertLink,
  convertBlock,
  convertStatement,
  convertEffect,
  convertExpression,
} from "./convert.mjs";

const generateParseProgram = (convert) => (code) =>
  convertProgram(parseAcornLoose(code));
const generateParseStatement = (convert) => (code) => {
  const node = parseAcornLoose(code);
  assert(node.type === "Program");
  assert(node.body.length === 1);
  return convert(node.body[0]);
};
const generateParseExpression = (convert) => (code) => {
  const node = parseAcornLoose(code);
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
