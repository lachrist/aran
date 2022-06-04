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

import {concat, includes, map} from "array-lite";

import {
  expect,
  SyntaxAranError,
  partialx_,
  partial_x,
  pushAll,
  assert,
  hasOwnProperty,
} from "../../../util/index.mjs";

import {
  makeEffectStatement,
  makeWriteEffect,
  makeReadExpression,
  makeLiteralExpression,
} from "../../../ast/index.mjs";

import {makeVariable} from "../variable.mjs";

import {
  makeStaticLookupEffect,
  makeStaticLookupExpression,
  makeExportUndefinedStatement,
  makeExportStatement,
} from "./helper.mjs";

const {
  Reflect: {ownKeys, defineProperty},
} = globalThis;

export const KINDS = ["let", "const"];

export const create = constant__(_layer, _options) => ({
  bindings: [],
});

export const harvest = constant_({
  header: [],
  prelude: [],
});

export const makeDeclareStatements = (
  strict,
  {bindings},
  kind,
  variable,
  iimport,
  eexports,
) => {
  assert(iimport === null, "unexpected imported variable");
  assert(eexports.length === null, "unexpected exported variable");
  assert(!includes(bindings, variable), "duplicate variable");
  push(bindings, variable);
  return [];
};

export const makeInitializeStatements = deadcode_____("initialization is forbidden in dead frames");

const generateMakeLookupNode =
  (makeLiftNode) =>
  (next, _escaped, _strict, {bindings}, variable, right) => {
    if (includes(bindings, variable)) {
      if (isDiscard(right)) {
        return makeLiftNode(makeLiteral(false));
      } else {
        return makeLiftNode(makeThrowDeadzoneExpression(variable));
      }
    } else {
      return next();
    }
  };

export const makeLookupExpression = generateMakeLookupNode(
  returnx,
);

export const makeLookupEffect = generateMakeLookupNode(makeExpressionEffect);
