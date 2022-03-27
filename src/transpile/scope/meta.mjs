// Invariant hypothesis: `Split.declareMeta` and `Split.initialize_meta`, and `Split.makeLookupMetaExpression` are only access in this module.
// Invariant hypothesis: Boxes cannot escape the callbacks of `Meta.makeBoxExpression` and `Meta.makeBoxStatement` via side effects.

// type Expression = lang.Expression
// type Box = Either (Either Primitive Intrinsic) (Either Identifier Identifier)
// type Identifier = .stratum.Identifier
//
// type Result = (Remainder, Box)
// type Remainder = Maybe Expression

import {
  assert,
  generateThrowError,
  getUUID,
  partial1,
  partial2,
} from "../../util.mjs";

import {
  makeLiteralExpression,
  makeWriteEffect,
  makeReadExpression,
  makeExpressionEffect,
} from "../../ast/index.mjs";

import {
  makeDirectIntrinsicExpression,
  makeGetExpression,
  makeStrictSetExpression,
} from "../intrinsic.mjs";

import {
  declareMetaVariable as declareVariable,
  makeMetaInitializeEffect as makeInitializeEffect,
  makeMetaLookupExpression as makeLookupExpression,
  makeMetaLookupEffect as makeLookupEffect,
} from "./split.mjs";

export {
  makeRootScope,
  makeRigidBaseDynamicScope,
  makeLooseBaseDynamicScope,
  makeEmptyScopeBlock,
  makeRigidScopeBlock,
  makeLooseScopeBlock,
  makeClosureScope,
  makePropertyScope,
  lookupScopeProperty,
  declareLooseBaseVariable,
  declareRigidBaseVariable,
  makeRigidBaseInitializeEffect,
  makeLooseBaseInitializeEffect,
  makeBaseLookupExpression,
  makeBaseLookupEffect,
} from "./split.mjs";

const onGhostHit = generateThrowError("unexpected ghost meta variable");
const onDeadHit = generateThrowError("unexpected meta variable in deadzone");
const onDynamicFrame = generateThrowError("unexpected meta dynamic frame");

/////////////
// Declare //
/////////////

export const declareMetaVariable = (scope, variable) => {
  const either = declareVariable(scope, variable, null);
  if (typeof either === "string") {
    return either;
  } else {
    assert(either === null, "unexpected dynamic meta frame");
    return `${variable}_${getUUID()}`;
  }
};

////////////////
// Initialize //
////////////////

const onInitializeMiss = (variable, expression) =>
  makeExpressionEffect(
    makeStrictSetExpression(
      makeDirectIntrinsicExpression("aran.globalDeclarativeRecord"),
      makeLiteralExpression(variable),
      expression,
    ),
  );

const onInitializeDeadHit = (expression, variable) =>
  makeWriteEffect(variable, expression);

export const makeMetaInitializeEffect = (scope, variable, expression) =>
  makeInitializeEffect(scope, variable, {
    onDynamicFrame,
    onMiss: partial2(onInitializeMiss, variable, expression),
    onDeadHit: partial1(onInitializeDeadHit, expression),
  });

//////////
// Read //
//////////

const onReadLiveHit = (variable, _note) => makeReadExpression(variable);

const onReadMiss = (variable) =>
  makeGetExpression(
    makeDirectIntrinsicExpression("aran.globalDeclarativeRecord"),
    makeLiteralExpression(variable),
  );

export const makeMetaReadExpression = (scope, variable) =>
  makeLookupExpression(scope, variable, {
    onDynamicFrame,
    onDeadHit,
    onGhostHit,
    onLiveHit: onReadLiveHit,
    onMiss: partial1(onReadMiss, variable),
  });

///////////
// Write //
///////////

const onWriteMiss = (variable, expression) =>
  makeExpressionEffect(
    makeStrictSetExpression(
      makeDirectIntrinsicExpression("aran.globalDeclarativeRecord"),
      makeLiteralExpression(variable),
      expression,
    ),
  );

const onWriteLiveHit = (expression, variable, _note) =>
  makeWriteEffect(variable, expression);

export const makeMetaWriteEffect = (scope, variable, expression) =>
  makeLookupEffect(scope, variable, {
    onGhostHit,
    onDeadHit,
    onDynamicFrame,
    onLiveHit: partial1(onWriteLiveHit, expression),
    onMiss: partial2(onWriteMiss, variable, expression),
  });
