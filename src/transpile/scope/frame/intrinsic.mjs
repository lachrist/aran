import {
  returnx,
  assert,
  constant_,
  deadcode_____,
  hasOwnProperty,
} from "../../../util/index.mjs";

import {
  makeIntrinsicExpression,
  makeExpressionEffect,
  makeLiteralExpression,
} from "../../../ast/index.mjs";

import {makeUnaryExpression} from "../../../intrinsic.mjs";

import {isRead, isDiscard, isTypeof} from "../right.mjs";

const {
  undefined,
  Reflect: {defineProperty},
} = globalThis;

const descriptor = {
  __proto__: null,
  value: null,
  writable: true,
  enumerable: true,
  configurable: true,
};

export const KINDS = ["intrinsic"];

export const create = (_layer, _options) => ({bindings: {}});

export const conflict = constant_(undefined);

export const harvest = constant_({header: [], prelude: []});

export const makeDeclareStatements = (
  _strict,
  {bindings},
  _kind,
  variable,
  {intrinsic},
) => {
  assert(!hasOwnProperty(bindings, variable), "duplicate variable");
  defineProperty(bindings, variable, {__proto__: descriptor, value: intrinsic});
  return [];
};

export const makeInitializeStatements = deadcode_____(
  "initialization on intrinsic frame",
);

const hit = (intrinsic, right) => {
  if (isRead(right)) {
    return makeIntrinsicExpression(intrinsic);
  } else if (isTypeof(right)) {
    return makeUnaryExpression("typeof", makeIntrinsicExpression(intrinsic));
  } else if (isDiscard(right)) {
    return makeLiteralExpression(false);
  } else {
    return makeLiteralExpression({undefined: null});
  }
};

const generateMakeLookupNode =
  (makeNode) =>
  (next, _strict, _escaped, {bindings}, variable, right) => {
    if (hasOwnProperty(bindings, variable)) {
      return makeNode(hit(bindings[variable], right));
    } else {
      return next();
    }
  };

export const makeLookupEffect = generateMakeLookupNode(makeExpressionEffect);

export const makeLookupExpression = generateMakeLookupNode(returnx);
