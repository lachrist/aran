import {flip, partial1} from "../../util.mjs";

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
  isRootBound,
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

const isRootBoundFlipped = flip(isRootBound);

export const isBaseRootBound = partial1(isRootBoundFlipped, BASE_KIND);

export const isMetaRootBound = partial1(isRootBoundFlipped, META_KIND);

const isWildcardBoundFlipped = flip(isWildcardBound);

export const isBaseWildcardBound = partial1(isWildcardBoundFlipped, BASE_KIND);

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

const generateMakeLookup =
  (makeVariable, makeLookup) => (scope, variable, callbacks) =>
    makeLookup(scope, makeVariable(variable), callbacks);

export const makeMetaLookupExpression = generateMakeLookup(
  makeMetaVariable,
  makeLookupExpression,
);

export const makeBaseLookupExpression = generateMakeLookup(
  makeBaseVariable,
  makeLookupExpression,
);

export const makeMetaLookupEffect = generateMakeLookup(
  makeMetaVariable,
  makeLookupEffect,
);

export const makeBaseLookupEffect = generateMakeLookup(
  makeBaseVariable,
  makeLookupEffect,
);
