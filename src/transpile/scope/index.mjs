"use strict";

import {
  makeRootScope,
  makeScopeBlock,
  makeClosureScope,
  makeScopeEvalExpression,
} from "./split.mjs";

import {
  initializeScope as initializeMetaScope,
  backupScope,
  restoreScope,
  declareVariable as declareMetaVariable,
  makeInitializeEffect as makeMetaInitializeEffect,
  makeReadExpression as makeMetaReadExpression,
  makeWriteEffect as makeMetaWriteEffect,
} from "./meta.mjs";

import {
  makeLookupableDynamicScope as makeBaseLookupableDynamicScope,
  makeDeclarableDynamicScope as makeBaseDeclarableDynamicScope,
  initializeScope as initalizeBaseScope,
  useStrictScope,
  isStrictScope,
  makePreludeStatementArray as makeBasePreludeStatementArray,
  makeLooseDeclareStatementArray as makeBaseLooseDeclareStatementArray,
  makeRigidDeclareStatementArray as makeBaseRigidDeclareStatementArray,
  makeRigidInitializeStatementArray as makeBaseRigidInitializeStatementArray,
  declareImportVariable as declareBaseImportVariable,
  makeLookupNode as makeBaseLookupNode,
} from "./base.mjs";



export const reifyGlobalScope = (scope) => makeDynamicScope(
  scope,
  [
    makeLooseDynamicFrame(false, makeDirectIntrinsicExpression("aran.globalObject")),
    makeRigidDynamicFrame(false, makeDirectIntrinsicExpression("aran.globalRecord")),
  ],
);

export const extendWithScope = (scope, duplicable) => makeDynamicScope(
  scope,
  [
    makeEmptyDynamicFrame(true, scope)
  ]
);

export const initializeScope = (scope, reified) =>
  makePropertyScope(makePropertyScope(scope, REIFIED, reified), STRICT, false);



export const makeRootScope = (reified) => initializeBaseScope(
  initializeMetaScope(makeRootScope()),
  reified,
);

export const makeWithDynamicScope = (parent, expression) => makeBaseLookupableDynamicScope(
  parent,
  true,
);

export const makeClosureDynamicScope = (parent, expression) => {

};



module.exports = require("./layer-5-index.js");


const makeWrite = generate({
  onStaticHit: (read, write, {writable}) => writable
    ? write(right)
    : makeThrowTypeErrorExpression("Assignment to constant variable"),
  onDynamicHit: (strict, object) => makeSetStrictExpression(
    strict,
    object,
    makeLiteralExpression(variable),
    right
  ),
  onDeadHit: (_note) => makeThrowReferenceErrorExpression(`Cannot access '${variable}' before initialization`),
  onMiss: (strict) => strict
    ? makeEffectExpression(
      makeThrowReferenceErrorExpression(`${variable} is not defined`),
    )
    : makeEffectExpression(
      makeSetStrictExpression(
        makeDirectIntrinsicExpression("aran.globalObject"),
        makeLiteralExpression(variable),
        right,
      ),
    ),
  onGlobal: (strict) => makeEffectStatement(
    makeSetGlobal(
      strict,
      makeLiteralExpression(variable),
      right,
    ),
  ),
});
