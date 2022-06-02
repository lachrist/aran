import {filter, map, concat, reduce, includes} from "array-lite";

import {
  hasOwnProperty,
  assert,
  partialx_,
  partial__x,
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

import {makeUnaryExpression} from "../../../intrinsic.mjs";

import {makeVariable, makeShadowVariable} from "../variable.mjs";

import {isRead, isTypeof, isDiscard, isWrite, accessWrite} from "../right.mjs";

import {
  makeThrowDeadzoneExpression,
  makeExportStatement,
  makeThrowConstantExpression,
  makeExportSequenceEffect,
} from "./helper.mjs";

const {
  Reflect: {ownKeys, defineProperty},
} = globalThis;

const kinds = ["let", "const", "class"];

const makeInitializedLookupNode = (binding, layer, variable, right) => {
  if (isRead(right)) {
    return makeReadExpression(makeVariable(layer, variable));
  } else if (isTypeof(right)) {
    return makeUnaryExpression(
      "typeof",
      makeReadExpression(makeVariable(layer, variable)),
    );
  } else if (isDiscard(right)) {
    return makeLiteralExpression(false);
  } else {
    return binding.writable
      ? reduce(
          binding.exports,
          partial__x(
            makeExportSequenceEffect,
            makeReadExpression(makeVariable(layer, variable)),
          ),
          makeWriteEffect(makeVariable(layer, variable), accessWrite(right)),
        )
      : makeExpressionEffect(makeThrowConstantExpression(variable));
  }
};

const hasDeadzone = (bindings, variable) => bindings[variable].deadzone;

const makeShadowInitializeStatement = (layer, variable) =>
  makeEffectStatement(
    makeWriteEffect(
      makeShadowVariable(layer, variable),
      makeLiteralExpression(false),
    ),
  );

export const create = (layer) => ({
  layer,
  bindings: {},
});

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
    prelude: map(deadzone_variables, partialx_(layer, makeShadowInitializeStatement)),
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
  if (includes(kinds, kind)) {
    assert(iimport === null, "unexpected imported variable");
    assert(!hasOwnProperty(bindings, variable), "duplicate variable");
    defineProperty(bindings, variable, {
      initialized: true,
      deadzone: false,
      writable: kind !== "const",
      exports: eexports,
    });
    return [];
  } else {
    return null;
  }
};

export const makeInitializeStatements = (_strict, {layer, bindings}, kind, variable, expression) => {
  if (includes(kinds, kind)) {
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
        ? [makeEffectStatement(makeShadowVariable(layer, variable), true)]
        : [],
      map(
        binding.exports,
        partialx_(
          makeExportStatement,
          makeReadExpression(makeVariable(layer, variable)),
        ),
      ),
    );
  } else {
    return null;
  }
};

export const makeLookupNode = (
  next,
  escaped,
  variable,
  {layer, bindings},
  right,
) => {
  if (hasOwnProperty(bindings, variable)) {
    const binding = bindings[variable];
    if (binding.initialized) {
      return makeInitializedLookupNode(binding, layer, variable, right);
    } else {
      if (isWrite(right)) {
        if (escaped) {
          binding.deadzone = true;
          return makeConditionalEffect(
            makeReadExpression(makeShadowVariable(layer, variable)),
            makeInitializedLookupNode(binding, layer, variable, right),
            makeExpressionEffect(makeThrowDeadzoneExpression(variable)),
          );
        } else {
          return makeExpressionEffect(makeThrowDeadzoneExpression(variable));
        }
      } else {
        if (escaped) {
          binding.deadzone = true;
          return makeConditionalExpression(
            makeReadExpression(makeShadowVariable(layer, variable)),
            makeInitializedLookupNode(binding, layer, variable, right),
            makeThrowDeadzoneExpression(variable),
          );
        } else {
          return makeThrowDeadzoneExpression(variable);
        }
      }
    }
  } else {
    return next();
  }
};
