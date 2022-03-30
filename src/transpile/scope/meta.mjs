// Invariant hypothesis: `Split.declareMeta` and `Split.initialize_meta`, and `Split.makeLookupMetaExpression` are only access in this module.
// Invariant hypothesis: Boxes cannot escape the callbacks of `Meta.makeBoxExpression` and `Meta.makeBoxStatement` via side effects.

// type Expression = lang.Expression
// type Box = Either (Either Primitive Intrinsic) (Either Identifier Identifier)
// type Identifier = .stratum.Identifier
//
// type Result = (Remainder, Box)
// type Remainder = Maybe Expression

import {throwError, getUUID, partial1} from "../../util.mjs";

import {
  makeConditionalEffect,
  makeConditionalExpression,
  makeLiteralExpression,
  makeExpressionEffect,
} from "../../ast/index.mjs";

import {
  makeHasExpression,
  makeThrowAranErrorExpression,
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

const onDeadHit = partial1(throwError, "unexpected meta variable in deadzone");

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

const generateOnInitializeDynamicFrame = (variable, expression) => (frame) =>
  makeConditionalEffect(
    makeHasExpression(frame, makeLiteralExpression(variable)),
    makeExpressionEffect(
      makeThrowAranErrorExpression(
        "duplicate initialization of dynamic compilation variable",
      ),
    ),
    makeExpressionEffect(
      makeStrictSetExpression(
        frame,
        makeLiteralExpression(variable),
        expression,
      ),
    ),
  );

const generateOnInitializeHit = (expression) => (write, _note) =>
  write(expression);

export const makeMetaInitializeEffect = (scope, variable, expression) =>
  makeInitializeEffect(scope, variable, {
    onDynamicFrame: generateOnInitializeDynamicFrame(variable, expression),
    onHit: generateOnInitializeHit(expression),
  });

//////////
// Read //
//////////

const onReadMiss = partial1(
  makeThrowAranErrorExpression,
  "missing dynamic compilation variable for reading",
);

const onReadLiveHit = (read, _write, _note) => read();

const generateOnReadDynamicFrame = (variable) => (frame, expression) =>
  makeConditionalExpression(
    makeHasExpression(frame, makeLiteralExpression(variable)),
    makeGetExpression(frame, makeLiteralExpression(variable)),
    expression,
  );

export const makeMetaReadExpression = (scope, variable) =>
  makeLookupExpression(scope, variable, {
    onDynamicFrame: generateOnReadDynamicFrame(variable),
    onDeadHit,
    onLiveHit: onReadLiveHit,
    onMiss: onReadMiss,
  });

///////////
// Write //
///////////

const onWriteMiss = partial1(
  makeExpressionEffect,
  makeThrowAranErrorExpression(
    "missing dynamic compilation variable for writing",
  ),
);

const generateOnWriteDynamicFrame = (variable, expression) => (frame, effect) =>
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

const generateOnWriteLiveHit = (expression) => (_read, write, _note) =>
  write(expression);

export const makeMetaWriteEffect = (scope, variable, expression) =>
  makeLookupEffect(scope, variable, {
    onDeadHit,
    onDynamicFrame: generateOnWriteDynamicFrame(variable, expression),
    onLiveHit: generateOnWriteLiveHit(expression),
    onMiss: onWriteMiss,
  });
