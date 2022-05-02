// Invariant hypothesis: `Split.declareMeta` and `Split.initialize_meta`, and `Split.makeLookupMetaExpression` are only access in this module.
// Invariant hypothesis: Boxes cannot escape the callbacks of `Meta.makeBoxExpression` and `Meta.makeBoxStatement` via side effects.

// type Expression = lang.Expression
// type Box = Either (Either Primitive Intrinsic) (Either Identifier Identifier)
// type Identifier = .stratum.Identifier
//
// type Result = (Remainder, Box)
// type Remainder = Maybe Expression

import {
  throwError,
  partial1,
  partial2,
  createCounter,
  incrementCounter,
} from "../../util.mjs";

import {makeLiteralExpression, makeExpressionEffect} from "../../ast/index.mjs";

import {freshenVariable} from "../../variable.mjs";

import {
  makeGetExpression,
  makeStrictSetExpression,
  makeDirectIntrinsicExpression,
} from "../intrinsic.mjs";

import {
  makeMetaPropertyScope as makePropertyScope,
  lookupMetaScopeProperty as lookupScopeProperty,
  isMetaBound as isBound,
  declareMetaVariable as declareVariable_,
  makeMetaInitializeEffect as makeInitializeEffect_,
  makeMetaLookupExpression as makeLookupExpression,
  makeMetaLookupEffect as makeLookupEffect,
} from "./split.mjs";

const COUNTER = "counter";

const onDeadHit = partial1(
  throwError,
  "meta variable should never be in deadzone",
);

const makeReadGlobalExpression = (variable) =>
  makeGetExpression(
    makeDirectIntrinsicExpression("aran.globalCache"),
    makeLiteralExpression(variable),
  );

const makeWriteGlobalEffect = (variable, expression) =>
  makeExpressionEffect(
    makeStrictSetExpression(
      makeDirectIntrinsicExpression("aran.globalCache"),
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

const readLiveHit = (read, _write, _note) => read();

export const makeReadExpression = (scope, variable) =>
  makeLookupExpression(scope, variable, {
    onDeadHit,
    onLiveHit: readLiveHit,
    onRoot: partial1(makeReadGlobalExpression, variable),
  });

///////////
// Write //
///////////

const generateWriteLiveHit = (expression) => (_read, write, _note) =>
  write(expression);

export const makeWriteEffect = (scope, variable, expression) =>
  makeLookupEffect(scope, variable, {
    onDeadHit,
    onLiveHit: generateWriteLiveHit(expression),
    onRoot: partial2(makeWriteGlobalEffect, variable, expression),
  });
