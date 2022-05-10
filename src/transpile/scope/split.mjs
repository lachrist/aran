import {returnFirst, assert} from "../../util.mjs";

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
  READ,
  makeRootScope,
  makeScopeBlock,
  makeClosureScope,
  makeDynamicScope as makeBaseDynamicScope,
  isBound as isBaseBound,
  isStaticallyBound as isBaseStaticallyBound,
  isDynamicallyBound as isBaseDynamicallyBound,
  getBindingDynamicExtrinsic as getBaseBindingDynamicExtrinsic,
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
  assert(
    !isDynamicallyBound(scope),
    "meta variables should never be dynamically bound",
  );
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

const ignoreDynamicExtrinsic = (callbacks) => ({
  ...callbacks,
  onDynamicExtrinsic: returnFirst,
});

const generateMakeLookup =
  (makeLookupNode, makeVariable, transformCallbacks) =>
  (scope, variable, right, callbacks) =>
    makeLookupNode(
      scope,
      makeVariable(variable),
      right,
      transformCallbacks(callbacks),
    );

export const makeMetaLookupExpression = generateMakeLookup(
  makeLookupExpression,
  makeMetaVariable,
  ignoreDynamicExtrinsic,
);

export const makeMetaLookupEffect = generateMakeLookup(
  makeLookupEffect,
  makeMetaVariable,
  ignoreDynamicExtrinsic,
);

export const makeBaseLookupExpression = generateMakeLookup(
  makeLookupExpression,
  makeBaseVariable,
  returnFirst,
);

export const makeBaseLookupEffect = generateMakeLookup(
  makeLookupEffect,
  makeBaseVariable,
  returnFirst,
);
