import { forEach, concat, map, includes } from "array-lite";

import {
  append,
  push,
  hasOwn,
  partialx_,
  partialx_x,
  partial__x,
  assert,
} from "../util/index.mjs";

import {
  makeDeclareExternalStatement,
  makeBlock,
  makeScriptProgram,
  makeReadExternalExpression,
  makeWriteExternalEffect,
  makeWriteEffect,
  makeLiteralExpression,
  makeReadExpression,
  makeEvalProgram,
  makeEvalExpression,
} from "../ast/index.mjs";

const {
  Error,
  Reflect: { defineProperty },
} = globalThis;

export const extendScope = (parent) => ({
  parent,
  secret: null,
  bindings: {},
  used: [],
});

export const createRootScope = (secret) => ({
  parent: null,
  secret,
  bindings: {},
  used: [],
});

const descriptor = {
  __proto__: null,
  value: null,
  configurable: true,
  enumerable: true,
  writable: true,
};

export const declareScope = ({ bindings }, variable, value) => {
  assert(!hasOwn(bindings, variable), "duplicate variable");
  defineProperty(bindings, variable, {
    __proto__: descriptor,
    value: { value },
  });
};

const getBindingScope = (scope, variable) => {
  while (scope !== null) {
    if (hasOwn(scope.bindings, variable)) {
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
  const { used } = getBindingScope(scope, variable);
  return includes(used, variable);
};

const pushUnique = (array, element) => {
  if (!includes(array, element)) {
    push(array, element);
  }
};

export const makeScopeReadExpression = (scope, variable) => {
  const { used, secret, parent } = getBindingScope(scope, variable);
  pushUnique(used, variable);
  return parent === null
    ? makeReadExternalExpression(`${secret}${variable}`)
    : makeReadExpression(variable);
};

export const makeScopeWriteEffect = (scope, variable, expression) => {
  const { used, secret, parent } = getBindingScope(scope, variable);
  pushUnique(used, variable);
  return parent === null
    ? makeWriteExternalEffect(`${secret}${variable}`, expression)
    : makeWriteEffect(variable, expression);
};

export const makeScopeBlock = ({ parent, used }, labels, statements) => {
  assert(parent !== null, "expected body scope");
  return makeBlock(labels, used, statements);
};

const makeUndefinedDeclareExternalStatement = partialx_x(
  makeDeclareExternalStatement,
  "let",
  makeLiteralExpression({ undefined: null }),
);

export const makeScopeScriptProgram = (
  { parent, secret, used },
  statements,
) => {
  assert(parent === null, "expected root scope");
  return makeScriptProgram(
    concat(
      map(
        map(used, partialx_(append, secret)),
        makeUndefinedDeclareExternalStatement,
      ),
      statements,
    ),
  );
};

export const useScope = (scope, variable) => {
  const { used } = getBindingScope(scope, variable);
  pushUnique(used, variable);
};

export const makeScopeEvalProgram = ({ parent, used }, parameters, block) => {
  assert(parent !== null, "expected body scope");
  return makeEvalProgram(parameters, used, block);
};

const evaluate = (scope, variable) => {
  const { used, parent } = getBindingScope(scope, variable);
  assert(parent !== null, "eval variable should not be root");
  pushUnique(used, variable);
};

export const makeScopeEvalExpression = (
  scope,
  parameters,
  variables,
  expression,
) => {
  forEach(variables, partialx_(evaluate, scope));
  return makeEvalExpression(parameters, variables, expression);
};
