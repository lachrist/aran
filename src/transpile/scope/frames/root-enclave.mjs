import {includes} from "array-lite";

import {return_x, assert} from "../../../util/index.mjs";

import {
  makeApplyExpression,
  makeLiteralExpression,
  makeExpressionEffect,
  makeDeclareStatement,
} from "../../../ast/index.mjs";

import {isWrite, isRead, isTypeof, isDiscard, accessWrite} from "../right.mjs";

const kinds = ["var", "function"];

export const create = return_x;

export const declare = (_frame, kind, _variable, iimport, eexports) => {
  assert(includes(kinds, kind), "unexpected kind");
  assert(iimport === null, "unexpected imported variable");
  assert(eexports.length === 0, "unexpected exported variable");
  return [];
};

export const initialize = (_frame, kind, variable, expression) => {
  assert(includes(kinds, kind), "unexpected kind");
  return [makeDeclareStatement("var", variable, expression)];
};

const pick = (frame, right, strict) => {
  if (isRead(right)) {
    return frame.read[strict ? "strict" : "sloppy"];
  } else if (isTypeof(right)) {
    return frame.typeof[strict ? "strict" : "sloppy"];
  } else if (isDiscard(right)) {
    return frame.discard[strict ? "strict" : "sloppy"];
  } else {
    return frame.write[strict ? "strict" : "sloppy"];
  }
};

export const lookup = (_next, frame, strict, _escaped, variable, right) => {
  const expression = pick(frame, right, strict);
  if (isWrite(right)) {
    return makeExpressionEffect(
      makeApplyExpression(
        expression,
        makeLiteralExpression({undefined: null}),
        [makeLiteralExpression(variable), accessWrite(right)],
      ),
    );
  } else {
    return makeApplyExpression(
      expression,
      makeLiteralExpression({undefined: null}),
      [makeLiteralExpression(variable)],
    );
  }
};
