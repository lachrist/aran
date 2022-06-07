// This frame is useful to normalize for...in and for...of statements.
// for (let x = y + x of iterator) { ... }
// {
//   y + throwReferenceError("'x' is not initialized");
//   const iterator = iterator[Symbol.iterator]();
//   let step = iterator.next();
//   while (!step.done) {
//     let x;
//     x = step.value;
//     stop = iterator.next();
//     ...;
//   }
// }

import {includes} from "array-lite";

import {
  returnx,
  deadcode_____,
  push,
  constant_,
  assert,
} from "../../../util/index.mjs";

import {
  makeExpressionEffect,
  makeLiteralExpression,
} from "../../../ast/index.mjs";

import {isDiscard} from "../right.mjs";

import {makeThrowDeadzoneExpression} from "./helper.mjs";

export const KINDS = ["let", "const", "class"];

export const create = (_layer, _options) => ({
  bindings: [],
});

export const harvest = constant_({
  header: [],
  prelude: [],
});

export const makeDeclareStatements = (
  _strict,
  {bindings},
  _kind,
  variable,
  iimport,
  eexports,
) => {
  assert(iimport === null, "unexpected imported variable");
  assert(eexports.length === 0, "unexpected exported variable");
  assert(!includes(bindings, variable), "duplicate variable");
  push(bindings, variable);
  return [];
};

export const makeInitializeStatements = deadcode_____(
  "initialization is forbidden in dead frames",
);

const generateMakeLookupNode =
  (makeLiftNode) =>
  (next, _escaped, _strict, {bindings}, variable, right) => {
    if (includes(bindings, variable)) {
      if (isDiscard(right)) {
        return makeLiftNode(makeLiteralExpression(false));
      } else {
        return makeLiftNode(makeThrowDeadzoneExpression(variable));
      }
    } else {
      return next();
    }
  };

export const makeLookupExpression = generateMakeLookupNode(returnx);

export const makeLookupEffect = generateMakeLookupNode(makeExpressionEffect);
