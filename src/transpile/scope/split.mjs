import {
  makeMetaVariable,
  makeBaseVariable,
  getVariableBody,
} from "../../variable.mjs";

import {
  declareVariable,
  declareFreshVariable,
  declareGhostVariable,
  makeInitializeEffect,
  makeLookupEffect,
  makeDynamicScope,
  makeScopeBlock,
  makeLookupExpression,
} from "./core.mjs";

export {
  makeRootScope,
  makeClosureScope,
  makePropertyScope,
  lookupScopeProperty,
  makeScopeEvalExpression,
} from "./core.mjs";

const META_KIND = 2;
const BASE_KIND = 3;
const LOOSE_KIND = 5;
const RIGID_KIND = 7;

//////////////////////
// makeDynamicScope //
//////////////////////

const generateMakeDynamicScope = (kinds) => (scope, frame) =>
  makeDynamicScope(scope, kinds, frame);

export const makeMetaDynamicScope = generateMakeDynamicScope(META_KIND);

export const makeRigidBaseDynamicScope = generateMakeDynamicScope(
  BASE_KIND * RIGID_KIND,
);

export const makeLooseBaseDynamicScope = generateMakeDynamicScope(
  BASE_KIND * LOOSE_KIND,
);

////////////////////
// makeScopeBlock //
////////////////////

const generateMakeScopeBlock = (kinds) => (scope, labels, curries) =>
  makeScopeBlock(scope, kinds, labels, curries);

export const makeEmptyScopeBlock = generateMakeScopeBlock(META_KIND);

export const makeRigidScopeBlock = generateMakeScopeBlock(
  META_KIND * BASE_KIND * LOOSE_KIND,
);

export const makeLooseScopeBlock = generateMakeScopeBlock(
  META_KIND * BASE_KIND * LOOSE_KIND * RIGID_KIND,
);

/////////////////////
// declareVariable //
/////////////////////

const generateDeclare =
  (kind, makeVariable, declare) => (scope, variable, note) => {
    const either = declare(scope, kind, makeVariable(variable), note);
    return typeof either === "string" ? getVariableBody(either) : either;
  };

export const declareMetaVariable = generateDeclare(
  META_KIND,
  makeMetaVariable,
  declareFreshVariable,
);

export const declareGhostRigidBaseVariable = generateDeclare(
  BASE_KIND * RIGID_KIND,
  makeBaseVariable,
  declareGhostVariable,
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
  (kind, makeVariable) => (scope, variable, curries) =>
    makeInitializeEffect(scope, kind, makeVariable(variable), curries);

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
  (kind, makeVariable, makeLookup) => (scope, variable, curries) =>
    makeLookup(scope, kind, makeVariable(variable), curries);

export const makeMetaLookupExpression = generateMakeLookup(
  META_KIND,
  makeMetaVariable,
  makeLookupExpression,
);

export const makeBaseLookupExpression = generateMakeLookup(
  BASE_KIND,
  makeBaseVariable,
  makeLookupExpression,
);

export const makeMetaLookupEffect = generateMakeLookup(
  META_KIND,
  makeMetaVariable,
  makeLookupEffect,
);

export const makeBaseLookupEffect = generateMakeLookup(
  BASE_KIND,
  makeBaseVariable,
  makeLookupEffect,
);
