import { zip, map, join } from "array-lite";

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
  String,
  undefined,
  JSON: { stringify: stringifyJSON },
  Reflect: { apply },
  Math: { max },
  String: {
    prototype: { split, padEnd, padStart },
  },
} = globalThis;

const getLength = ({ length }) => length;

const addEmptyLine = (lines, target) => {
  while (lines.length < target) {
    lines[lines.length] = "";
  }
};

const side = (text1, text2) => {
  const lines1 = apply(split, text1, ["\n"]);
  const lines2 = apply(split, text2, ["\n"]);
  const length = max(lines1.length, lines2.length);
  const pad_index = String(length + 1).length;
  const pad_line_1 = apply(max, undefined, map(lines1, getLength));
  const pad_line_2 = apply(max, undefined, map(lines2, getLength));
  addEmptyLine(lines1, length);
  addEmptyLine(lines2, length);
  return join(
    map(
      zip(lines1, lines2),
      ([line1, line2], index) =>
        `${apply(padStart, String(index + 1), [pad_index, " "])} | ${apply(
          padEnd,
          line1,
          [pad_line_1, " "],
        )} | ${apply(padEnd, line2, [pad_line_2, " "])} |`,
    ),
    "\n",
  );
};

const generateAllign = (parse, stringify, visit) => (node, code) => {
  code = stringify(parse(code));
  const error = getResultError(visit(node, parse(code), makeRootError()));
  if (error === null) {
    return null;
  } else {
    const message = getErrorMessage(error);
    const { value: left } = getErrorLeft(error);
    const { value: right, annotation: location } = getErrorRight(error);
    return `${message} (${location}): mismatch between ${stringifyJSON(
      left,
    )} and ${stringifyJSON(right)}${"\n"}${side(stringify(node), code)}`;
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

const alligners = {
  program: allignProgram,
  block: allignBlock,
  statement: allignStatement,
  link: allignLink,
  effect: allignEffect,
  expression: allignExpression,
};

export const allign = (type, node, code) => {
  const alligner = alligners[type];
  return alligner(node, code);
};

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
