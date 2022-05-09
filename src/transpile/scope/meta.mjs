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
  makeStrictSetExpression,
  makeDirectIntrinsicExpression,
} from "../intrinsic.mjs";

import {
  makeMetaPropertyScope as makePropertyScope,
  lookupMetaScopeProperty as lookupScopeProperty,
  isMetaBound as isBound,
  declareMetaVariable as declareVariable_,
  makeMetaInitializeEffect as makeInitializeEffect_,
  makeMetaLookupNode as makeLookupNode,
} from "./split.mjs";

const COUNTER = "counter";

const onDeadHit = partialx(
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

export const makeReadExpression = (scope, variable) =>
  makeLookupNode(scope, variable, null, {
    onDeadHit,
    onLiveHit: returnFirst,
    onRoot: partialx(makeReadGlobalExpression, variable),
  });

///////////
// Write //
///////////

export const makeWriteEffect = (scope, variable, right) =>
  makeLookupNode(scope, variable, right, {
    onDeadHit,
    onLiveHit: returnFirst,
    onRoot: partialxx(makeWriteGlobalEffect, variable, right),
  });
