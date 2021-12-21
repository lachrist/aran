import {filter} from "array-lite";

import {
  makeWriteEffect,
  makeExpressionEffect,
  makeApplyExpression,
  makeIntrinsicExpression,
  makeLiteralExpression,
  makeReadExpression,
} from "../ast/index.mjs";

import {assert} from "../util.mjs";

const {
  undefined,
  Reflect: {getOwnPropertyDescriptor, defineProperty, ownKeys},
} = globalThis;

const SCRIPT = "@script";

export const createRootScope = () => null;

export const extendScriptScope = (parent, namespace) => ({
  __proto__: parent,
  [SCRIPT]: namespace,
});

export const extendScope = (parent) => ({
  __proto__: parent,
  [SCRIPT]: null,
});

export const declareScopeVariable = (
  scope,
  {variable, value, duplicable, initialized},
) => {
  const descriptor = getOwnPropertyDescriptor(scope, variable);
  if (descriptor === undefined) {
    defineProperty(scope, variable, {
      __proto__: null,
      configurable: true,
      enumerable: true,
      writable: true,
      value: {
        value,
        script: scope[SCRIPT],
        used: initialized,
        initialized,
      },
    });
  } else {
    assert(duplicable, "duplicate variable declaration");
  }
};

export const lookupScopeVariable = (scope, variable) => scope[variable].value;

export const makeScopeWriteEffect = (scope, variable, expression) => {
  const binding = scope[variable];
  assert(binding !== undefined, "missing variable");
  binding.used = true;
  return binding.script === null
    ? makeWriteEffect(variable, expression)
    : makeExpressionEffect(
        makeApplyExpression(
          makeIntrinsicExpression("aran.setStrict"),
          makeLiteralExpression({undefined: null}),
          [
            makeApplyExpression(
              makeIntrinsicExpression("aran.readGlobal"),
              makeLiteralExpression({undefined: null}),
              [makeLiteralExpression(binding.script)],
            ),
            makeLiteralExpression(variable),
            expression,
          ],
        ),
      );
};

export const makeScopeInitializeEffect = (scope, variable, expression) => {
  const binding = scope[variable];
  assert(binding !== undefined, "missing variable");
  assert(binding.used, "unused variable should not be initialized");
  assert(!binding.initialized, "duplicate variable initialization");
  binding.initialized = true;
  return makeScopeWriteEffect(scope, variable, expression);
};

export const makeScopeReadExpression = (scope, variable) => {
  const binding = scope[variable];
  assert(binding !== undefined, "missing variable");
  binding.used = true;
  return binding.script === null
    ? makeReadExpression(variable)
    : makeApplyExpression(
        makeIntrinsicExpression("aran.get"),
        makeLiteralExpression({undefined: null}),
        [
          makeApplyExpression(
            makeIntrinsicExpression("aran.readGlobal"),
            makeLiteralExpression({undefined: null}),
            [makeLiteralExpression(binding.script)],
          ),
          makeLiteralExpression(variable),
        ],
      );
};

export const isScopeVariableUsed = (scope, variable) => scope[variable].used;

export const isScopeVariableInitialized = (scope, variable) =>
  scope[variable].initialized;

export const getUsedScopeVariableArray = (scope) =>
  filter(
    ownKeys(scope),
    (variable) => variable !== SCRIPT && scope[variable].used,
  );
