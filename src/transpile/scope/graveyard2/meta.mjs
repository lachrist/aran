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
  incrementGlobalCounter
} from "./property.mjs";

import {
  READ,
  declareMetaVariable as declareStaticVariable,
  makeMetaInitializeEffect as makeStaticInitializeEffect,
  makeMetaLookupExpression as makeStaticLookupExpression,
  makeMetaLookupEffect as makeStaticLookupEffect,
} from "./static/layer.mjs";

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

/////////////
// Declare //
/////////////

export const declareVariable = (scope, variable) => {
  if (isStaticallyBound(scope)) {
    return declareStaticVariable(
      getStaticFrame(scope),
      getDepth(scope),
      variable,
      null,
    );
  } else if (isDynamicallyBound(scope)) {
    return declareDynamicVariable(
      getStaticFrame(scope),
      getDepth(scope),
      variable,
      null,
    );
  } else {
    throw new Error("unbound scope");
  }
};

////////////////
// Initialize //
////////////////

export const attemptInitializeEffect = (scope, variable, expression) => {
  if (isStaticallyBound(scope)) {
    const maybe_effect = attemptInitializeEffect(
      getStaticFrame(scope),
      false,
      variable,
      expression,
    );
    assert(maybe_effect !== null, "cannot initialize distant meta variable");
    return maybe_effect;
  } else {
    makeWriteGlobalEffect(variable, expression);
  }
};

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
