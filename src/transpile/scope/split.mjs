import {flip, partial1, returnFirst, returnSecond} from "../../util.mjs";

import {
  makeMetaVariable,
  makeBaseVariable,
  getVariableBody,
} from "../../variable.mjs";

import {
  makeRootScope as $makeRootScope,
  getRoot,
  setRoot,
  makeWildcardScope,
  makeScopeBlock,
  isWildcardBound,
  isBlockBound,
  isBound,
  getBindingWildcard,
  declareVariable,
  declareFreshVariable,
  makeInitializeEffect,
  makeLookupExpression,
  makeLookupEffect,
} from "./core.mjs";

export {
  makeClosureScope,
  makePropertyScope,
  lookupScopeProperty,
  makeScopeEvalExpression,
} from "./core.mjs";

const META_KIND = 2;
const BASE_KIND = 3;
const LOOSE_KIND = 5;
const RIGID_KIND = 7;

///////////////////
// makeRootScope //
///////////////////

export const makeRootScope = (meta, base) =>
  $makeRootScope({
    meta,
    base,
  });

const generateGetRoot = (key) => (scope) => getRoot(scope)[key];

export const getMetaRoot = generateGetRoot("meta");
export const getBaseRoot = generateGetRoot("base");

const generateSetRoot = (key1, key2) => (scope, value) =>
  setRoot(scope, {
    [key1]: value,
    [key2]: getRoot(scope)[key1],
  });

export const setMetaRoot = generateSetRoot("meta", "base");

export const setBaseRoot = generateSetRoot("base", "meta");

///////////////////////
// makeWildcardScope //
///////////////////////

// The global meta frame can be represented as:
// * a proper wildcard frame.
//   - must handle lookup of meta variable in intermediary wildcard frames
//   + readability
// * the absence of binding frame.
//   + meta variable are decoupled from wildcard frames
//   - readability

const makeWildcardScopeFlipped = flip(makeWildcardScope);

export const makeBaseWildcardScope = partial1(
  makeWildcardScopeFlipped,
  BASE_KIND,
);

export const makeRigidBaseWildcardScope = partial1(
  makeWildcardScopeFlipped,
  BASE_KIND * RIGID_KIND,
);

export const makeLooseBaseWildcardScope = partial1(
  makeWildcardScopeFlipped,
  BASE_KIND * LOOSE_KIND,
);

/////////////
// isBound //
/////////////

const isBoundFlipped = flip(isBound);

export const isBaseBound = partial1(isBoundFlipped, BASE_KIND);

export const isMetaBound = partial1(isBoundFlipped, META_KIND);

export const isBaseWildcardBound = partial1(flip(isWildcardBound), BASE_KIND);

export const isBaseBlockBound = partial1(flip(isBlockBound), BASE_KIND);

////////////////
// getBinding //
////////////////

const getBindingWildcardFlipped = flip(getBindingWildcard);

export const getBaseBindingWildcard = partial1(
  getBindingWildcardFlipped,
  BASE_KIND,
);

////////////////////
// makeScopeBlock //
////////////////////

const makeScopeBlockFlipped = flip(makeScopeBlock);

export const makeEmptyScopeBlock = partial1(makeScopeBlockFlipped, META_KIND);

export const makeRigidScopeBlock = partial1(
  makeScopeBlockFlipped,
  META_KIND * BASE_KIND * RIGID_KIND,
);

export const makeLooseScopeBlock = partial1(
  makeScopeBlockFlipped,
  META_KIND * BASE_KIND * LOOSE_KIND,
);

export const makeFullScopeBlock = partial1(
  makeScopeBlockFlipped,
  META_KIND * BASE_KIND * LOOSE_KIND * RIGID_KIND,
);

/////////////////////
// declareVariable //
/////////////////////

const generateDeclare =
  (kind, makeVariable, declare) => (scope, variable, note) =>
    getVariableBody(declare(scope, kind, makeVariable(variable), note));

export const declareMetaFreshVariable = generateDeclare(
  META_KIND,
  makeMetaVariable,
  declareFreshVariable,
);

export const declareRigidBaseVariable = generateDeclare(
  BASE_KIND * RIGID_KIND,
  makeBaseVariable,
  declareVariable,
);

export const declareLooseBaseVariable = generateDeclare(
  BASE_KIND * LOOSE_KIND,
  makeBaseVariable,
  declareVariable,
);

////////////////////
// makeInitialize //
////////////////////

const generateMakeInitialize =
  (kind, makeVariable) => (scope, variable, expression) =>
    makeInitializeEffect(scope, kind, makeVariable(variable), expression);

export const makeMetaInitializeEffect = generateMakeInitialize(
  META_KIND,
  makeMetaVariable,
);

export const makeRigidBaseInitializeEffect = generateMakeInitialize(
  BASE_KIND * RIGID_KIND,
  makeBaseVariable,
);

export const makeLooseBaseInitializeEffect = generateMakeInitialize(
  BASE_KIND * LOOSE_KIND,
  makeBaseVariable,
);

////////////////
// makeLookup //
////////////////

const ignoreWildcard = (callbacks) => ({
  ...callbacks,
  onWildcard: returnSecond,
});

const generateMakeLookup =
  (makeVariable, makeLookup, transformCallbacks) =>
  (scope, variable, callbacks) =>
    makeLookup(scope, makeVariable(variable), transformCallbacks(callbacks));

export const makeMetaLookupExpression = generateMakeLookup(
  makeMetaVariable,
  makeLookupExpression,
  ignoreWildcard,
);

export const makeBaseLookupExpression = generateMakeLookup(
  makeBaseVariable,
  makeLookupExpression,
  returnFirst,
);

export const makeMetaLookupEffect = generateMakeLookup(
  makeMetaVariable,
  makeLookupEffect,
  ignoreWildcard,
);

export const makeBaseLookupEffect = generateMakeLookup(
  makeBaseVariable,
  makeLookupEffect,
  returnFirst,
);
