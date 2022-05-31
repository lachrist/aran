import {concat, map, includes} from "array-lite";

import {
  push,
  hasOwnProperty,
  partialx,
  partialx_x,
  partial__x,
  assert,
} from "../util/index.mjs";

import {
  makeDeclareStatement,
  makeBlock,
  makeScriptProgram,
  makeWriteEffect,
  makeExpressionEffect,
  makeLiteralExpression,
  makeReadExpression,
} from "../ast/index.mjs";

import {
  makeGetGlobalExpression,
  makeSetGlobalStrictExpression,
} from "../intrinsic.mjs";

const {
  Error,
  Reflect: {defineProperty},
} = globalThis;

export const extendScope = (parent) => ({
  parent,
  bindings: {},
  used: [],
});

export const createRootScope = partialx(extendScope, null);

const descriptor = {
  __proto__: null,
  value: null,
  configurable: true,
  enumerable: true,
  writable: true,
};

export const declareScope = ({bindings}, variable, value) => {
  assert(!hasOwnProperty(bindings, variable), "duplicate variable");
  defineProperty(bindings, variable, {
    __proto__: descriptor,
    value: {value},
  });
};

const getBindingScope = (scope, variable) => {
  while (scope !== null) {
    if (hasOwnProperty(scope.bindings, variable)) {
      return scope;
    }
    scope = scope.parent;
  }
  throw new Error("missing variable");
};

const lookup = (scope, variable, key) =>
  getBindingScope(scope, variable).bindings[variable][key];

export const lookupScope = partial__x(lookup, "value");

export const isScopeUsed = (scope, variable) => {
  const {used} = getBindingScope(scope, variable);
  return includes(used, variable);
};

const pushUnique = (array, element) => {
  if (!includes(array, element)) {
    push(array, element);
  }
};

export const makeScopeReadExpression = (scope, variable) => {
  const {used, parent} = getBindingScope(scope, variable);
  pushUnique(used, variable);
  return parent === null
    ? makeGetGlobalExpression(variable)
    : makeReadExpression(variable);
};

export const makeScopeWriteEffect = (scope, variable, expression) => {
  const {used, parent} = getBindingScope(scope, variable);
  pushUnique(used, variable);
  return parent === null
    ? makeExpressionEffect(makeSetGlobalStrictExpression(variable, expression))
    : makeWriteEffect(variable, expression);
};

export const makeScopeBlock = ({parent, used}, labels, statements) => {
  assert(parent !== null, "expected body scope");
  return makeBlock(labels, used, statements);
};

const makeUndefinedDeclareStatement = partialx_x(
  makeDeclareStatement,
  "let",
  makeLiteralExpression({undefined: null}),
);

export const makeScopeScriptProgram = ({parent, used}, statements) => {
  assert(parent === null, "expected root scope");
  return makeScriptProgram(
    concat(map(used, makeUndefinedDeclareStatement), statements),
  );
};
