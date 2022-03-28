// Invariant hypothesis: `Split.declareMeta` and `Split.initialize_meta`, and `Split.makeLookupMetaExpression` are only access in this module.
// Invariant hypothesis: Boxes cannot escape the callbacks of `Meta.makeBoxExpression` and `Meta.makeBoxStatement` via side effects.

// type Expression = lang.Expression
// type Box = Either (Either Primitive Intrinsic) (Either Identifier Identifier)
// type Identifier = .stratum.Identifier
//
// type Result = (Remainder, Box)
// type Remainder = Maybe Expression

import {throwError, getUUID, partial1, partial2} from "../../util.mjs";

import {
  makeConditionalEffect,
  makeConstructExpression,
  makeLiteralExpression,
  makeWriteEffect,
  makeReadExpression,
  makeExpressionEffect,
} from "../../ast/index.mjs";

import {
  makeHasExpression,
  makeThrowReferenceErrorExpression,
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
  makeMetaDynamicScope,
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

const onGhostHit = partial1(throwError, "unexpected ghost meta variable");
const onDeadHit = partial1(throwError, "unexpected meta variable in deadzone");
const onMiss = () =>
  makeThrowReferenceErrorExpression(
    "missing aran variable, it should never happen",
  );

/////////////
// Declare //
/////////////

export const declareMetaVariable = (scope, variable) => {
  const either = declareVariable(scope, variable, null);
  return typeof either === "string" ? either : `${variable}_${getUUID()}`;
};

////////////////
// Initialize //
////////////////

const onInitializeDynamicFrame = (variable, expression, frame) =>
  makeExpressionEffect(
    makeStrictSetExpression(frame, makeLiteralExpression(variable), expression),
  );

const onInitializeDeadHit = (expression, variable) =>
  makeWriteEffect(variable, expression);

export const makeMetaInitializeEffect = (scope, variable, expression) =>
  makeInitializeEffect(scope, variable, {
    onDynamicFrame: partial2(onInitializeDynamicFrame, variable, expression),
    onDeadHit: partial1(onInitializeDeadHit, expression),
  });

//////////
// Read //
//////////

const onReadLiveHit = (variable, _note) => makeReadExpression(variable);

const onReadDynamicFrame = (variable, frame, expression) =>
  makeConstructExpression(
    makeHasExpression(frame, makeLiteralExpression(variable)),
    makeGetExpression(frame, makeLiteralExpression(variable)),
    expression,
  );

export const makeMetaReadExpression = (scope, variable) =>
  makeLookupExpression(scope, variable, {
    onDynamicFrame: partial1(onReadDynamicFrame, variable),
    onDeadHit,
    onGhostHit,
    onLiveHit: onReadLiveHit,
    onMiss,
  });

///////////
// Write //
///////////

const onWriteDynamicFrame = (variable, expression, frame, effect) =>
  makeConditionalEffect(
    makeHasExpression(frame, makeLiteralExpression(variable)),
    makeExpressionEffect(
      makeStrictSetExpression(
        frame,
        makeLiteralExpression(variable),
        expression,
      ),
    ),
    effect,
  );

const onWriteLiveHit = (expression, variable, _note) =>
  makeWriteEffect(variable, expression);

export const makeMetaWriteEffect = (scope, variable, expression) =>
  makeLookupEffect(scope, variable, {
    onGhostHit,
    onDeadHit,
    onDynamicFrame: partial2(onWriteDynamicFrame, variable, expression),
    onLiveHit: partial1(onWriteLiveHit, expression),
    onMiss,
  });
