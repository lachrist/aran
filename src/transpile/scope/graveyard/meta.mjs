// Invariant hypothesis: `Split.declareMeta` and `Split.initialize_meta`, and `Split.makeLookupMetaExpression` are only access in this module.
// Invariant hypothesis: Boxes cannot escape the callbacks of `Meta.makeBoxExpression` and `Meta.makeBoxStatement` via side effects.

// type Expression = lang.Expression
// type Box = Either (Either Primitive Intrinsic) (Either Identifier Identifier)
// type Identifier = .stratum.Identifier
//
// type Result = (Remainder, Box)
// type Remainder = Maybe Expression

import {
  returnFirst,
  throwError,
  partialx,
  partialxx,
  createCounter,
  incrementCounter,
} from "../../util.mjs";

import {makeLiteralExpression, makeExpressionEffect} from "../../ast/index.mjs";

import {freshenVariable} from "../../variable.mjs";

import {
  makeGetExpression,
  makeSetStrictExpression,
  makeGlobalCacheExpression,
} from "../../intrinsic.mjs";

import {
  READ,
  makeMetaPropertyScope as makePropertyScope,
  lookupMetaScopeProperty as lookupScopeProperty,
  isMetaBound as isBound,
  declareMetaVariable as declareVariable_,
  makeMetaInitializeEffect as makeInitializeEffect_,
  makeMetaLookupExpression as makeLookupExpression,
  makeMetaLookupEffect as makeLookupEffect,
} from "./split.mjs";

const COUNTER = "counter";

const onStaticDeadHit = partialx(
  throwError,
  "meta variable should never be in deadzone",
);

const makeReadGlobalExpression = (variable) =>
  makeGetExpression(
    makeGlobalCacheExpression(),
    makeLiteralExpression(variable),
  );

const makeWriteGlobalEffect = (variable, expression) =>
  makeExpressionEffect(
    makeSetStrictExpression(
      makeGlobalCacheExpression(),
      makeLiteralExpression(variable),
      expression,
    ),
  );

///////////////////
// makeRootScope //
///////////////////

export const initializeScope = (scope) =>
  makePropertyScope(scope, COUNTER, createCounter());

export const backupScope = (scope) =>
  incrementCounter(lookupScopeProperty(scope, COUNTER));

export const restoreScope = (scope, value1) => {
  const counter = lookupScopeProperty(scope, COUNTER);
  let value2 = incrementCounter(counter);
  while (value2 <= value1) {
    value2 = incrementCounter(counter);
  }
};

/////////////
// Declare //
/////////////

export const declareVariable = (scope, variable) =>
  isBound(scope)
    ? declareVariable_(scope, variable, null)
    : freshenVariable(variable, 0, lookupScopeProperty(scope, COUNTER));

////////////////
// Initialize //
////////////////

export const makeInitializeEffect = (scope, variable, expression) =>
  isBound(scope)
    ? makeInitializeEffect_(scope, variable, expression)
    : makeWriteGlobalEffect(variable, expression);

//////////
// Read //
//////////

export const makeReadExpression = (scope, variable) =>
  makeLookupExpression(scope, variable, READ, {
    onStaticDeadHit,
    onStaticLiveHit: returnFirst,
    onStaticMiss: partialx(makeReadGlobalExpression, variable),
  });

///////////
// Write //
///////////

export const makeWriteEffect = (scope, variable, right) =>
  makeLookupEffect(scope, variable, right, {
    onStaticDeadHit,
    onStaticLiveHit: returnFirst,
    onStaticMiss: partialxx(makeWriteGlobalEffect, variable, right),
  });
