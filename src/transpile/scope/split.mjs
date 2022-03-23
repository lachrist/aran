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

const META_KIND = "meta";
const RIGID_BASE_KIND = "rigid-base";
const LOOSE_BASE_KIND = "loose-base";

//////////////////////
// makeDynamicScope //
//////////////////////

const generateMakeDynamicScope = (kinds) => (scope, frame) =>
  makeDynamicScope(scope, kinds, frame);

export const makeMetaDynamicScope = generateMakeDynamicScope([META_KIND]);

export const makeRigidBaseDynamicScope = generateMakeDynamicScope([
  RIGID_BASE_KIND,
]);

export const makeLooseBaseDynamicScope = generateMakeDynamicScope([
  RIGID_BASE_KIND,
  LOOSE_BASE_KIND,
]);

////////////////////
// makeScopeBlock //
////////////////////

const generateMakeScopeBlock = (kinds) => (scope, labels, curries) =>
  makeScopeBlock(scope, kinds, labels, curries);

export const makeEmptyScopeBlock = generateMakeScopeBlock([META_KIND]);

export const makeRigidScopeBlock = generateMakeScopeBlock([
  META_KIND,
  RIGID_BASE_KIND,
]);

export const makeLooseScopeBlock = generateMakeScopeBlock([
  META_KIND,
  RIGID_BASE_KIND,
  LOOSE_BASE_KIND,
]);

/////////////////////
// declareVariable //
/////////////////////

const generateDeclare =
  (declare, makeVariable, kind) => (scope, variable, note) => {
    const either = declare(scope, kind, makeVariable(variable), note);
    return typeof either === "string" ? getVariableBody(either) : either;
  };

export const declareMetaVariable = generateDeclare(
  declareFreshVariable,
  makeMetaVariable,
  META_KIND,
);

export const declareGhostRigidBaseVariable = generateDeclare(
  declareGhostVariable,
  makeBaseVariable,
  RIGID_BASE_KIND,
);

export const declareRigidBaseVariable = generateDeclare(
  declareVariable,
  makeBaseVariable,
  RIGID_BASE_KIND,
);

export const declareLooseBaseVariable = generateDeclare(
  declareVariable,
  makeBaseVariable,
  LOOSE_BASE_KIND,
);

////////////////////
// makeInitialize //
////////////////////

const generateMakeInitialize =
  (makeVariable, kind) => (scope, variable, curries) =>
    makeInitializeEffect(scope, kind, makeVariable(variable), curries);

export const makeMetaInitializeEffect = generateMakeInitialize(
  makeMetaVariable,
  META_KIND,
);

export const makeRigidBaseInitializeEffect = generateMakeInitialize(
  makeBaseVariable,
  RIGID_BASE_KIND,
);

export const makeLooseBaseInitializeEffect = generateMakeInitialize(
  makeBaseVariable,
  LOOSE_BASE_KIND,
);

////////////////
// makeLookup //
////////////////

const generateMakeLookup =
  (makeLookup, makeVariable) => (scope, variable, curries) =>
    makeLookup(scope, makeVariable(variable), curries);

export const makeMetaLookupExpression = generateMakeLookup(
  makeLookupExpression,
  makeMetaVariable,
);

export const makeBaseLookupExpression = generateMakeLookup(
  makeLookupExpression,
  makeBaseVariable,
);

export const makeMetaLookupEffect = generateMakeLookup(
  makeLookupEffect,
  makeMetaVariable,
);

export const makeBaseLookupEffect = generateMakeLookup(
  makeLookupEffect,
  makeBaseVariable,
);
