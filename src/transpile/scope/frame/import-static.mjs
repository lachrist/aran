import {
  expect,
  bind___,
  constant_,
  assert,
  hasOwnProperty,
  deadcode_____,
  SyntaxAranError,
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

export const KIND = ["import"];

export const create = (_layer, _options) => ({bindings: {}});

export const conflict = (_strict, {bindings}, _kind, variable) => {
  expect(
    !hasOwnProperty(bindings, variable),
    SyntaxAranError,
    "Duplicate variable declaration: %s.",
    [variable],
  );
};

export const harvest = constant_({header: [], prelude: []});

export const makeDeclareStatements = (
  _strict,
  {bindings},
  _kind,
  variable,
  {source, specifier},
) => {
  assert(!hasOwnProperty(bindings, variable), "duplicate variable");
  defineProperty(bindings, variable, {
    __proto__: descriptor,
    value: {source, specifier},
  });
  return [];
};

export const makeInitializeStatements = deadcode_____(
  "imported variable should not be initialized",
);

const makeHitLookupExpression = (bindings, variable, right) => {
  const {source, specifier} = bindings[variable];
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
  (makeHitLookupNode) =>
  (next, _strict, _escaped, {bindings}, variable, right) => {
    if (hasOwnProperty(bindings, variable)) {
      return makeHitLookupNode(bindings, variable, right);
    } else {
      return next();
    }
  };

export const makeLookupExpression = generateMakeLookupNode(
  makeHitLookupExpression,
);

export const makeLookupEffect = generateMakeLookupNode(makeHitLookupEffect);
