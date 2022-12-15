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

import { getResultError } from "./result.mjs";

import {
  visitExpression,
  visitEffect,
  visitLink,
  visitStatement,
  visitBlock,
  visitProgram,
} from "./visit.mjs";

const {
  JSON: { stringify: stringifyJSON },
} = globalThis;

const generateAllign = (parse, stringify, visit) => (node, code) => {
  const error = getResultError(visit(node, parse(code), makeRootError()));
  if (error === null) {
    return null;
  } else {
    const message = getErrorMessage(error);
    const { value: left } = getErrorLeft(error);
    const { value: right, annotation: location } = getErrorRight(error);
    return `${message} (${location}): mismatch between ${stringifyJSON(
      left,
    )} and ${stringifyJSON(right)}${"\n"}${stringify(node)}`;
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

// Bad idea: does not share variable mappings
//
// const isNotNull = (any) => any !== null;
//
// const generateAllignArray = (allign) => {
//   const allignElement = (nodes, code, index) => allign(nodes[index], code);
//   return (nodes, codes) => {
//     if (nodes.length !== codes.length) {
//       return "top-level array length mismatch";
//     } else {
//       return find(
//         mapCurry(codes, makeCurry(allignElement, nodes)),
//         isNotNull,
//       );
//     }
//   }
// };
