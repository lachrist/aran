import {
  bind___,
  constant_,
  assert,
  hasOwnProperty,
} from "../../../util/index.mjs";

import {
  makeExpressionEffect,
  makeImportExpression,
  makeLiteralExpression,
} from "../../../ast/index.mjs";

import {makeUnaryExpression} from "../../../intrinsic.mjs";

import {isRead, isTypeof, isDiscard} from "../right.mjs";

import {makeThrowConstantExpression} from "./helper.mjs";

const {
  Reflect: {defineProperty},
} = globalThis;

const descriptor = {
  __proto__: null,
  value: null,
  writable: true,
  enumerable: true,
  configurable: true,
};

export const create = (_layer, _options) => ({});

export const harvest = constant_({header: [], prelude: []});

export const makeDeclareStatements = (
  _strict,
  frame,
  kind,
  variable,
  iimport,
  eexports,
) => {
  if (kind === "import") {
    assert(iimport !== null, "expected imported variable");
    assert(eexports.length === 0, "aggregate should be done as a link");
    assert(!hasOwnProperty(frame, variable), "duplicate import variable");
    defineProperty(frame, variable, {__proto__: descriptor, value: iimport});
    return [];
  } else {
    return null;
  }
};

export const makeInitializeStatements = (
  _strict,
  _frame,
  kind,
  _variable,
  _expression,
) => {
  assert(kind !== "import", "imported variable should not be initialized");
  return null;
};

const makeHitLookupExpression = (frame, variable, right) => {
  const {source, specifier} = frame[variable];
  if (isRead(right)) {
    return makeImportExpression(source, specifier);
  } else if (isTypeof(right)) {
    return makeUnaryExpression(
      "typeof",
      makeImportExpression(source, specifier),
    );
  } else if (isDiscard(right)) {
    return makeLiteralExpression(false);
  } else {
    return makeThrowConstantExpression(variable);
  }
};

const makeHitLookupEffect = bind___(
  makeExpressionEffect,
  makeHitLookupExpression,
);

export const generateMakeLookupNode =
  (makeHitLookupNode) => (next, _strict, _escaped, frame, variable, right) => {
    if (hasOwnProperty(frame, variable)) {
      return makeHitLookupNode(frame, variable, right);
    } else {
      return next();
    }
  };

export const makeLookupExpression = generateMakeLookupNode(
  makeHitLookupExpression,
);

export const makeLookupEffect = generateMakeLookupNode(makeHitLookupEffect);
