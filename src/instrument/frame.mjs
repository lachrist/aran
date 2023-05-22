import { hasOwn, assert } from "../util/index.mjs";

import {
  makeReadExternalExpression,
  makeWriteExternalEffect,
  makeWriteEffect,
  makeReadExpression,
} from "../ast/index.mjs";

const {
  Object: { fromEntries },
} = globalThis;

export const makeExternalFrame = (entries, prefix) => ({
  prefix,
  bindings: fromEntries(entries),
});

export const makeInternalFrame = (entries) => ({
  prefix: null,
  bindings: fromEntries(entries),
});

export const hasFrame = ({ bindings }, variable) => hasOwn(bindings, variable);

export const getFrame = ({ bindings }, variable) => {
  assert(hasOwn(bindings, variable), "missing frame binding");
  return bindings[variable];
};

export const makeFrameReadExpression = ({ bindings, prefix }, variable) => {
  assert(hasOwn(bindings, variable), "missing frame binding");
  return prefix === null
    ? makeReadExpression(variable)
    : makeReadExternalExpression(`${prefix}${variable}`);
};

export const makeFrameWriteEffect = (
  { bindings, prefix },
  variable,
  expression,
) => {
  assert(hasOwn(bindings, variable), "missing frame binding");
  return prefix === null
    ? makeWriteEffect(variable, expression)
    : makeWriteExternalEffect(`${prefix}${variable}`, expression);
};

export const collect = {
  ApplyExpression: ({ 1: expression1, 2: expression2, 3: expressions }) => {
    if (
      expression1[0] === "IntrinsicExpression" &&
      expression1[1] === "aran.get" &&
      expression2[0] === "LiteralExpression" &&
      toLiteral(expression2[1]) === undefined &&
      expressions.length === 2 &&
      expressions[0][0] === "ReadExternalExpression" &&
      expressions
      )
  }
}
