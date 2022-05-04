import {returnFirst, returnSecond, assert} from "../../util.mjs";

import {
  makeMetaVariable,
  makeBaseVariable,
  getVariableBody,
} from "../../variable.mjs";

import {
  isBound,
  isDynamicallyBound,
  declareVariable,
  declareGhostVariable,
  declareFreshVariable,
  makeInitializeEffect,
  makeLookupExpression,
  makeLookupEffect,
  makePropertyScope,
  lookupScopeProperty,
} from "./core.mjs";

// The global meta frame can be represented as:
// * a proper dynamic frame.
//   - must handle lookup of meta variable in intermediary dynamic frames
//   + readability
// * the absence of binding frame.
//   + meta variable are decoupled from dynamic frames
//   - readability

export {
  makeRootScope,
  makeScopeBlock,
  makeClosureScope,
  makeDynamicScope as makeBaseDynamicScope,
  isBound as isBaseBound,
  isStaticallyBound as isBaseStaticallyBound,
  isDynamicallyBound as isBaseDynamicallyBound,
  getBindingDynamicFrame as getBaseBindingDynamicFrame,
  makeScopeEvalExpression,
} from "./core.mjs";

/////////////////////////
// lookupScopeProperty //
/////////////////////////

const generateMakePropertyScope = (prefix) => (scope, key, value) =>
  makePropertyScope(scope, `${prefix}-${key}`, value);
const generateLookupScopeProperty = (prefix) => (scope, key) =>
  lookupScopeProperty(scope, `${prefix}-${key}`);

export const makeMetaPropertyScope = generateMakePropertyScope("meta");
export const lookupMetaScopeProperty = generateLookupScopeProperty("meta");

export const makeBasePropertyScope = generateMakePropertyScope("base");
export const lookupBaseScopeProperty = generateLookupScopeProperty("base");

/////////////
// isBound //
/////////////

export const isMetaBound = (scope) => {
  assert(!isDynamicallyBound(scope), "unexpected dynamic frame");
  return isBound(scope);
};

/////////////////////
// declareVariable //
/////////////////////

const generateDeclare = (makeVariable, declare) => (scope, variable, note) =>
  getVariableBody(declare(scope, makeVariable(variable), note));

export const declareMetaVariable = generateDeclare(
  makeMetaVariable,
  declareFreshVariable,
);

export const declareBaseVariable = generateDeclare(
  makeBaseVariable,
  declareVariable,
);

export const declareBaseGhostVariable = generateDeclare(
  makeBaseVariable,
  declareGhostVariable,
);

////////////////////
// makeInitialize //
////////////////////

const generateMakeInitialize =
  (makeVariable) => (scope, variable, expression) =>
    makeInitializeEffect(scope, makeVariable(variable), expression);

export const makeMetaInitializeEffect =
  generateMakeInitialize(makeMetaVariable);

export const makeBaseInitializeEffect =
  generateMakeInitialize(makeBaseVariable);

////////////////
// makeLookup //
////////////////

const ignoreDynamicFrame = (callbacks) => ({
  ...callbacks,
  onDynamicFrame: returnSecond,
});

const generateMakeLookup =
  (makeVariable, makeLookup, transformCallbacks) =>
  (scope, variable, callbacks) =>
    makeLookup(scope, makeVariable(variable), transformCallbacks(callbacks));

export const makeMetaLookupExpression = generateMakeLookup(
  makeMetaVariable,
  makeLookupExpression,
  ignoreDynamicFrame,
);

export const makeBaseLookupExpression = generateMakeLookup(
  makeBaseVariable,
  makeLookupExpression,
  returnFirst,
);

export const makeMetaLookupEffect = generateMakeLookup(
  makeMetaVariable,
  makeLookupEffect,
  ignoreDynamicFrame,
);

export const makeBaseLookupEffect = generateMakeLookup(
  makeBaseVariable,
  makeLookupEffect,
  returnFirst,
);
