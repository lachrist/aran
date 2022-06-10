import {filter, map, concat} from "array-lite";

import {
  expect,
  SyntaxAranError,
  hasOwnProperty,
  assert,
  partial_x,
  partialx_,
  returnx,
} from "../../../util/index.mjs";

import {
  makeConditionalExpression,
  makeConditionalEffect,
  makeEffectStatement,
  makeLiteralExpression,
  makeExpressionEffect,
  makeReadExpression,
  makeWriteEffect,
} from "../../../ast/index.mjs";

import {makeVariable, makeShadowVariable} from "../variable.mjs";

import {isWrite} from "../right.mjs";

import {
  makeThrowDeadzoneExpression,
  makeExportStatement,
  makeThrowConstantExpression,
  makeStaticLookupExpression,
  makeStaticLookupEffect,
} from "./helper.mjs";

const {
  Reflect: {ownKeys, defineProperty},
} = globalThis;

const hasDeadzone = (bindings, variable) => bindings[variable].deadzone;

const makeShadowInitializeStatement = (layer, variable) =>
  makeEffectStatement(
    makeWriteEffect(
      makeShadowVariable(layer, variable),
      makeLiteralExpression(false),
    ),
  );

const descriptor = {
  __proto__: null,
  value: null,
  configurable: true,
  enumerable: true,
  writable: true,
};

export const KINDS = ["let", "const", "class"];

export const create = (layer, {distant}) => ({
  layer,
  distant,
  bindings: {},
});

export const conflict = (_strict, {bindings}, _kind, variable) => {
  expect(
    !hasOwnProperty(bindings, variable),
    SyntaxAranError,
    "Variable '%s' has already been declared",
    [variable],
  );
};

export const harvest = ({layer, bindings}) => {
  const variables = ownKeys(bindings);
  const deadzone_variables = filter(
    variables,
    partialx_(hasDeadzone, bindings),
  );
  return {
    header: concat(
      map(variables, partialx_(makeVariable, layer)),
      map(deadzone_variables, partialx_(makeShadowVariable, layer)),
    ),
    prelude: map(
      deadzone_variables,
      partialx_(makeShadowInitializeStatement, layer),
    ),
  };
};

export const makeDeclareStatements = (
  _strict,
  {bindings},
  kind,
  variable,
  iimport,
  eexports,
) => {
  assert(iimport === null, "unexpected imported variable");
  assert(!hasOwnProperty(bindings, variable), "duplicate variable");
  defineProperty(bindings, variable, {
    __proto__: descriptor,
    value: {
      initialized: false,
      deadzone: false,
      writable: kind !== "const",
      exports: eexports,
    },
  });
  return [];
};

export const makeInitializeStatements = (
  _strict,
  {layer, bindings},
  _kind,
  variable,
  expression,
) => {
  assert(
    hasOwnProperty(bindings, variable),
    "missing variable for initialization",
  );
  const binding = bindings[variable];
  assert(!binding.initialized, "duplicate initialization");
  binding.initialized = true;
  return concat(
    [
      makeEffectStatement(
        makeWriteEffect(makeVariable(layer, variable), expression),
      ),
    ],
    binding.deadzone
      ? [
          makeEffectStatement(
            makeWriteEffect(
              makeShadowVariable(layer, variable),
              makeLiteralExpression(true),
            ),
          ),
        ]
      : [],
    map(
      binding.exports,
      partial_x(
        makeExportStatement,
        makeReadExpression(makeVariable(layer, variable)),
      ),
    ),
  );
};

export const generateMakeLookupNode =
  (makeStaticLookupNode, makeConditionalNode, makeLiftNode) =>
  (next, strict, escaped, {distant, layer, bindings}, variable, right) => {
    if (hasOwnProperty(bindings, variable)) {
      const binding = bindings[variable];
      if (!binding.initialized && !escaped) {
        return makeLiftNode(makeThrowDeadzoneExpression(variable));
      } else {
        const node =
          isWrite(right) && !binding.writable
            ? makeLiftNode(makeThrowConstantExpression(variable))
            : makeStaticLookupNode(
                strict,
                layer,
                variable,
                right,
                binding.exports,
              );
        if (binding.initialized && !distant) {
          return node;
        } else {
          binding.deadzone = true;
          return makeConditionalNode(
            makeReadExpression(makeShadowVariable(layer, variable)),
            node,
            makeLiftNode(makeThrowDeadzoneExpression(variable)),
          );
        }
      }
    } else {
      return next();
    }
  };

export const makeLookupExpression = generateMakeLookupNode(
  makeStaticLookupExpression,
  makeConditionalExpression,
  returnx,
);

export const makeLookupEffect = generateMakeLookupNode(
  makeStaticLookupEffect,
  makeConditionalEffect,
  makeExpressionEffect,
);
