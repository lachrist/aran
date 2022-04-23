// Invariant hypothesis: `Split.declareMeta` and `Split.initialize_meta`, and `Split.makeLookupMetaExpression` are only access in this module.
// Invariant hypothesis: Boxes cannot escape the callbacks of `Meta.makeBoxExpression` and `Meta.makeBoxStatement` via side effects.

// type Expression = lang.Expression
// type Box = Either (Either Primitive Intrinsic) (Either Identifier Identifier)
// type Identifier = .stratum.Identifier
//
// type Result = (Remainder, Box)
// type Remainder = Maybe Expression

import {throwError, partial1, partial2, createCounter} from "../../util.mjs";

import {makeLiteralExpression, makeExpressionEffect} from "../../ast/index.mjs";

import {freshenVariable} from "../../variable.mjs";

import {
  makeGetExpression,
  makeStrictSetExpression,
  makeDirectIntrinsicExpression,
} from "../intrinsic.mjs";

import {
  isMetaBound,
  getMetaRoot,
  makeRootScope as $makeRootScope,
  declareMetaFreshVariable as $declareMetaFreshVariable,
  makeMetaInitializeEffect as $makeMetaInitializeEffect,
  makeMetaLookupExpression as $makeMetaLookupExpression,
  makeMetaLookupEffect as $makeMetaLookupEffect,
} from "./split.mjs";

export {
  isBaseBound,
  isBaseWildcardBound,
  isBaseBlockBound,
  makeRigidBaseWildcardScope,
  makeLooseBaseWildcardScope,
  makeEmptyScopeBlock,
  makeRigidScopeBlock,
  makeLooseScopeBlock,
  makeFullScopeBlock,
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

const onDeadHit = partial1(
  throwError,
  "meta variable should never be in deadzone",
);

const makeReadRootExpression = (variable) =>
  makeGetExpression(
    makeDirectIntrinsicExpression("aran.globalCache"),
    makeLiteralExpression(variable),
  );

const makeWriteRootEffect = (variable, expression) =>
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

export const makeRootScope = (base) => $makeRootScope(createCounter(), base);

/////////////
// Declare //
/////////////

export const declareMetaVariable = (scope, variable) =>
  isMetaBound(scope)
    ? $declareMetaFreshVariable(scope, variable, null)
    : freshenVariable(variable, 0, getMetaRoot(scope));

////////////////
// Initialize //
////////////////

export const makeMetaInitializeEffect = (scope, variable, expression) =>
  isMetaBound(scope)
    ? $makeMetaInitializeEffect(scope, variable, expression)
    : makeWriteRootEffect(variable, expression);

//////////
// Read //
//////////

const readLiveHit = (read, _write, _note) => read();

export const makeMetaReadExpression = (scope, variable) =>
  $makeMetaLookupExpression(scope, variable, {
    onDeadHit,
    onLiveHit: readLiveHit,
    onRoot: partial1(makeReadRootExpression, variable),
  });

///////////
// Write //
///////////

const generateWriteLiveHit = (expression) => (_read, write, _note) =>
  write(expression);

export const makeMetaWriteEffect = (scope, variable, expression) =>
  $makeMetaLookupEffect(scope, variable, {
    onDeadHit,
    onLiveHit: generateWriteLiveHit(expression),
    onRoot: partial2(makeWriteRootEffect, variable, expression),
  });
